/**
 * --------A nightly ledger consistency job that:-------------
 * Runs every night at 02:00 AM
 * Checks every wallet in one efficient query,
 * Logs inconsistencies/mismatches into the DB(ledger_audit_log table)
 * Sends Slack/email alerts to IT Risk
 * 
 * 
 * | Component                   | Role                                     |
| --------------------------- | ---------------------------------------- |
| `ledger_entries`            | Source of truth for all credits/debits   |
| `wallets`                   | Stores current user-visible balances     |
| `ledger_audit_log`          | Keeps record of detected inconsistencies |
| `reconcileAllWallets()`     | Core reconciliation logic                |
| `alerts.ts`                 | Sends Slack/email notifications          |
| `nightlyLedgerReconcile.ts` | Cron runner for automation               |

| Layer           | Component                     | Description                                   |
| --------------- | ----------------------------- | --------------------------------------------- |
| **Detection**   | Nightly Ledger Reconciliation | Finds inconsistencies automatically           |
| **Review**      | Ops Dashboard + API           | Allows manual verification of mismatches      |
| **Remediation** | Controlled Fix Logic          | Safely corrects wallet balances               |
| **Governance**  | Audit Table + SOP             | Ensures traceability and separation of duties |



Runbook: Daily IT Risk SOP
| Step | Actor           | Action                                                       |
| ---- | --------------- | ------------------------------------------------------------ |
| 1 | Cron Job        | Nightly `reconcileAllWallets()` runs, populates audit table  |
| 2 | IT Risk Officer | Logs into Dashboard → sees “pending” inconsistencies         |
| 3 | Officer         | Clicks *Recalculate* to verify if still mismatched           |
| 4 | Officer         | If confirmed, clicks *Fix & Resolve* → system adjusts wallet |
| 5 | System          | Marks record “resolved”, sends closure email/slack           |
| 6 | Compliance      | Reviews logs weekly to confirm no repeated discrepancies     |

*/

import cron from "node-cron";
import { reconcileAllWallets } from "../src/jobs/reconcileLedger.ts";

cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Running nightly ledger reconciliation...");
    await reconcileAllWallets();
  } catch (err) {
    console.error("Ledger reconciliation failed:", err);
  }
});
