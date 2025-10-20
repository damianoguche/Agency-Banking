/**
 * A complete reconciliation + audit automation pipeline
 * It does it in two layers:
 * A dynamic SQL view (vw_inconsistent_ledgers) to detect
 * inconsistencies live.
 * A Sequelize job to log those inconsistencies into ledger_audit_log
 * automatically, typically via a nightly cron run.
 *
 * =================================================================
 * A ready-to-run SQL view that highlights inconsistencies dynamically
 * A Sequelize backend script that auto-generates the ledger_audit_log
 * entries from that view (like a nightly reconciliation job).
 */

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
  console.log("Starting nightly ledger reconciliation...");

  const [inconsistencies] = await sequelize.query<LedgerInconsistency[]>(
    `
    SELECT walletId, computed_balance, actual_balance, difference, status
    FROM vw_inconsistent_ledgers
  `,
    { type: QueryTypes.SELECT }
  );

  // fallback if empty
  if (!inconsistencies || inconsistencies.length === 0) {
    console.log("No inconsistencies found.");
    return;
  }

  for (const row of inconsistencies) {
    // Check if already logged today to avoid duplicates
    const [existing] = await sequelize.query(
      `
      SELECT id FROM ledger_audit_log 
      WHERE walletId = ? 
        AND DATE(created_at) = CURDATE()
        AND status = 'inconsistent'
      LIMIT 1
    `,
      { replacements: [row.walletId] }
    );

    if (existing.length === 0) {
      await sequelize.query(
        `
        INSERT INTO ledger_audit_log 
        (walletId, computed_balance, actual_balance, difference, status, review_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `,
        {
          replacements: [
            row.walletId,
            row.computed_balance,
            row.actual_balance,
            row.difference,
            row.status
          ]
        }
      );

      console.log(
        `Logged inconsistency for wallet ${row.walletId} (diff: ${row.difference})`
      );
    } else {
      console.log(`Wallet ${row.walletId} already logged today.`);
    }
  }

  console.log("Ledger reconciliation completed.");
}
