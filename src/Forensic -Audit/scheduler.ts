/**
 * Schedule the Job (Daily)
Use node-cron or a system scheduler (e.g., PM2 or systemd cron):
This runs every day at 2:00 AM, verifying all audit records.
*/
import cron from "node-cron";
import { verifyAuditChain } from "./jobs/verifyAuditChain";

cron.schedule("0 2 * * *", async () => {
  console.log("Running daily audit integrity verification...");
  await verifyAuditChain();
});
