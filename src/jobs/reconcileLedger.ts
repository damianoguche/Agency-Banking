/**
 * Runs one SQL aggregation for all wallets
 * Logs inconsistencies in ledger_audit_log table
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
       SELECT w.walletNumber AS walletId,
       COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS computed_balance,
            w.balance AS actual_balance,
       (COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - w.balance) AS difference,
       CASE 
       WHEN (COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - w.balance) = 0 
       THEN 'consistent'
       ELSE 'inconsistent'
       END AS status,
       NOW() AS generated_at
       FROM wallets w
       LEFT JOIN ledger_entries le ON w.walletNumber = le.wallet_number
       GROUP BY w.walletNumber
       HAVING difference <> 0;
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
            computed_balance: inc.computed_balance,
            actual_balance: inc.actual_balance,
            difference,
            status: "inconsistent"
          },
          { transaction: t }
        );
      }

      // Send alert
      await sendLedgerAlert(inconsistencies);

      console.log(
        `${inconsistencies.length} ledger inconsistencies found and logged.`
      );
    }
  );
}
