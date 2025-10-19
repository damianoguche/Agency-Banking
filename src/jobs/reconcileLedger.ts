/**
 * Runs one SQL aggregation for all wallets
 * Logs inconsistencies
 * Sends alerts
 */
import { QueryTypes, Transaction } from "sequelize";
import sequelize from "../config/db.ts";
import { LedgerAuditLog } from "../models/ledger_audit_log.ts";
import { sendLedgerAlert } from "../util/alerts.ts";

// Define a TypeScript type for the query result
interface WalletInconsistency {
  walletId: number;
  computed_balance: number;
  actual_balance: number;
}

export async function reconcileAllWallets() {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      console.log("Starting ledger reconciliation job...");

      const query = `
        SELECT 
          le.walletId,
          SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount ELSE -le.amount END) AS computed_balance,
          w.balance AS actual_balance
        FROM ledger_entries le
        JOIN wallets w ON le.walletId = w.id
        GROUP BY le.walletId, w.balance
        HAVING computed_balance <> w.balance;
      `;

      const inconsistencies = (await sequelize.query(query, {
        type: QueryTypes.SELECT,
        transaction: t
      })) as WalletInconsistency[];

      if (inconsistencies.length === 0) {
        console.log("Ledger fully consistent across all wallets.");
        return;
      }

      // Log inconsistencies
      for (const inc of inconsistencies) {
        const difference =
          Number(inc.computed_balance) - Number(inc.actual_balance);

        await LedgerAuditLog.create(
          {
            walletId: inc.walletId,
            computedBalance: inc.computed_balance,
            actualBalance: inc.actual_balance,
            difference,
            status: "inconsistent"
          },
          { transaction: t }
        );
      }

      // Send alert
      await sendLedgerAlert(inconsistencies);

      console.log(
        `Ledger inconsistencies found: ${inconsistencies.length} wallets logged.`
      );
    }
  );
}
