/**
 * Tthe cron job queries MySQL/PostgreSQL via Sequelize using the same
 * config/db.js connection. The flow looks like this:
 *
 * [Node worker running at 2 AM]  →  connects to  →  [MySQL/Postgres DB]
 *
 * It will:
 * run this script (reconcile.ts or reconcile.js)
 * The script Queries ledger entries in the DB.
 * Compare debit/credit sums.
 * Insert reconciliation reports back into the DB.
 * Th worker  schedules its cron jobs and executes them automatically
 * every night.
 * 
 ┌───────────────────────────┐
 │     API Server(s)         │
 │  (Express + Sequelize)    │
 │                           │
 │  Handles requests         │
 └──────────┬────────────────┘
            │
            │
 ┌──────────▼───────────────┐
 │  Reconciliation Worker   │
 │  (node-cron @ 2:00 AM)   │
 │  Runs reconcile.ts       │
 │  via PM2 or cron         │
 └──────────┬───────────────┘
            │
            ▼
     ┌────────────┐
     │   MySQL    │
     │transactions, 
         ledger 
     └────────────┘

     Run the script manually:
     npx ts-node scripts/reconcile.ts

     In deploying to production:
     Either:
     - Add node-cron to your backend or
     - Create a small dedicated worker with PM2 or Linux cron that runs at
      2 AM.
      - Ensure it uses the same .env / DB credentials as your app.
 */

import cron from "node-cron";
import runReconciliation from "./reconcile.ts";

cron.schedule(
  "0 2 * * *",
  async () => {
    console.log(
      "Starting daily reconciliation at",
      new Date().toISOString().slice(0, 19).replace("T", " ")
    );
    try {
      await runReconciliation();
    } catch (err) {
      console.error("Reconciliation error", err);
    }
  },
  {
    timezone: "Africa/Lagos"
  }
);
