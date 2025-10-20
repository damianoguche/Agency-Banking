import { QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

interface LedgerInconsistency {
  walletId: string;
  computed_balance: number;
  actual_balance: number;
  difference: number;
  status: "consistent" | "inconsistent";
}

export async function reconcileLedgers() {
  const [results] = await sequelize.query<LedgerInconsistency[]>(
    `
    SELECT
      w.wallet_number AS walletId,
      COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS computed_balance,
      w.balance AS actual_balance,
      (COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - w.balance) AS difference
    FROM wallets w
    LEFT JOIN ledger_entries le ON w.wallet_number = le.wallet_number
    GROUP BY w.wallet_number
  `,
    { type: QueryTypes.SELECT }
  );

  // fallback if empty
  if (!results || results.length === 0) {
    console.log("No inconsistencies found.");
    return;
  }

  for (const row of results) {
    if (row.difference !== 0) {
      await sequelize.query(
        `
        INSERT INTO ledger_audit_log 
        (walletId, computed_balance, actual_balance, difference, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'inconsistent', NOW(), NOW())
      `,
        {
          replacements: [
            row.walletId,
            row.computed_balance,
            row.actual_balance,
            row.difference
          ]
        }
      );
    }
  }
}
