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
