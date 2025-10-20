import cron from "node-cron";
import { reconcileLedgers } from "../remediate.ts";

cron.schedule("0 2 * * *", async () => {
  await reconcileLedgers();
});
