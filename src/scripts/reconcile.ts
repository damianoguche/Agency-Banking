/**
 * This job will:
 * Group ledger_entries by transaction_reference.
 * For each reference, compute sum_credit and sum_debit.
 * Flag rows where sums are not equal or entries are missing (e.g., only
 * one entry).
 * Insert a record into a reconciliation_reports table (or store as a CSV)
 * for human review and alerting.
 */

import sequelize from "../config/db.ts";
import { QueryTypes } from "sequelize";
import TransactionHistory from "../models/transaction.ts";

// Simple logger
const log = console.log;

async function runReconciliation() {
  log(
    "Reconciliation run starting",
    new Date().toISOString().slice(0, 19).replace("T", " ")
  );

  // 1) Find references with mismatch
  const mismatches = await sequelize.query(
    `
    SELECT
      transaction_reference AS reference,
      SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS debit_sum,
      SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) AS credit_sum,
      COUNT(*) AS entry_count
    FROM ledger_entries
    GROUP BY transaction_reference
    HAVING debit_sum <> credit_sum OR entry_count < 2
    `,
    { type: QueryTypes.SELECT }
  );

  log(`Found ${mismatches.length} mismatched transaction(s)`);

  for (const row of mismatches as any[]) {
    const { reference, debit_sum, credit_sum, entry_count } = row;

    // fetch transaction row for more context
    const txn = await TransactionHistory.findOne({ where: { reference } });

    const issueParts = [];
    if (Number(entry_count) < 2) issueParts.push("missing ledger entries");
    if (Number(debit_sum) !== Number(credit_sum))
      issueParts.push("imbalanced amounts");

    const issue = issueParts.join("; ") || "unknown issue";

    // Persist into reconciliation_reports (if created)
    try {
      await sequelize.query(
        `INSERT INTO reconciliation_reports (run_at, reference, debit_sum, credit_sum, issue, payload)
         VALUES (NOW(), ?, ?, ?, ?, ?)`,
        {
          replacements: [
            reference,
            debit_sum,
            credit_sum,
            issue,
            JSON.stringify({ txn: txn ? txn.toJSON() : null })
          ],
          type: QueryTypes.INSERT
        }
      );
    } catch (e) {
      log("Failed to write reconciliation report row", e);
    }

    // Send alert / log
    log(
      `RECONCILE ALERT: ${reference} => debit=${debit_sum} credit=${credit_sum} issue=${issue}`
    );
    // TODO: integrate with your alerting (email, Slack, PagerDuty)
  }

  log(
    "Reconciliation run finished",
    new Date().toISOString().slice(0, 19).replace("T", " ")
  );
}

// If run directly
if (require.main === module) {
  runReconciliation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Reconciliation failed", err);
      process.exit(1);
    });
}

export default runReconciliation;
