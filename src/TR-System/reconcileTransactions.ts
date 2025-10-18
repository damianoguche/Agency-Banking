import fs from "fs";
import path from "path";
import { QueryTypes } from "sequelize";
import sequelize from "../config/db.ts";
import Transaction from "../models/transaction.ts";
import * as csvStringify from "csv-stringify/lib/sync";
import nodemailer from "nodemailer";
import { Status } from "../types/status.ts";

// Optional: implement this to enqueue remediation jobs
async function enqueueRemediation(reference: string, reason: string) {
  // Example: insert to an Outbox/Job table or push to a queue (Redis/Kafka)
  // await Outbox.create({ reference, type: 'RETRY_CREDIT', payload: JSON.stringify({ reference }), status: 'PENDING' });
  console.log(`Enqueued remediation for ${reference}: ${reason}`);
}

// Report and alert config
const REPORT_DIR = path.resolve(process.cwd(), "recon_reports");
const ALERT_EMAIL_TO = process.env.RECON_ALERT_EMAILS || "ops@example.com";

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "user",
    pass: process.env.SMTP_PASS || "pass"
  }
};

// Define Typescript interface for the query result
// Ensures that TypeScript knows exactly what shape of data to expect
// from the query.
type ReconRow = {
  reference: string;
  debit_count: number;
  credit_count: number;
  debit_sum: number;
  credit_sum: number;
  reversal_count: number;
  issues: string;
  latest: string;
};

async function detectExceptions(limit = 1000): Promise<ReconRow[]> {
  // Use raw SQL aggregation for speed and correctness
  const sql = `
    SELECT
      reference,
      COUNT(CASE WHEN type = 'debit' THEN 1 END) AS debit_count,
      COUNT(CASE WHEN type = 'credit' THEN 1 END) AS credit_count,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS debit_sum,
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS credit_sum,
      COUNT(CASE WHEN type = 'reversal' THEN 1 END) AS reversal_count,
      MAX("created_at") AS latest
    FROM 'transaction'
    GROUP BY reference
    HAVING
      (COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END),0) != COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END),0))
      OR COUNT(CASE WHEN type = 'debit' THEN 1 END) = 0
      OR COUNT(CASE WHEN type = 'credit' THEN 1 END) = 0
      OR COUNT(CASE WHEN type = 'reversal' THEN 1 END) > 0
    ORDER BY latest DESC
    LIMIT limit;
  `;

  // QueryTypes in Sequelize is an enumeration (enum) that tells
  // Sequelize how to interpret and handle the result of a raw SQL
  // query.
  const rows: any[] = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { limit }
  });

  const result: ReconRow[] = [];

  for (const r of rows) {
    const issues: string[] = [];
    if (Number(r.debit_count) === 0) issues.push("NO_DEBIT");
    if (Number(r.credit_count) === 0) issues.push("NO_CREDIT");
    if (Number(r.reversal_count) > 0) issues.push("REVERSAL_PRESENT");
    if (Number(r.debit_sum) !== Number(r.credit_sum))
      issues.push("AMOUNT_MISMATCH");
    // duplicate legs
    if (Number(r.debit_count) > 1) issues.push("MULTIPLE_DEBITS");
    if (Number(r.credit_count) > 1) issues.push("MULTIPLE_CREDITS");

    result.push({
      reference: r.reference,
      debit_count: Number(r.debit_count),
      credit_count: Number(r.credit_count),
      debit_sum: Number(r.debit_sum),
      credit_sum: Number(r.credit_sum),
      reversal_count: Number(r.reversal_count),
      issues: issues.join(";"),
      latest: r.latest
    });
  }

  return result;
}

async function investigateAndRemediate(rows: ReconRow[]) {
  const exceptionsDetailed: any[] = [];

  for (const r of rows) {
    // Load transaction legs for this reference
    const legs = await Transaction.findAll({
      where: { reference: r.reference },
      order: [["createdAt", "ASC"]]
    });

    // Build a human-friendly description
    const legSummary = legs.map((l) => ({
      id: l.id,
      type: l.type,
      wallet: l.walletNumber,
      amount: l.amount,
      status: l.status,
      created_at: l.created_at
    }));

    // Auto-remediation policy (example)
    // - If DEBIT exists (success) and CREDIT missing and no REVERSAL -> attempt credit retry/enqueue
    // - If amounts mismatch -> flag for manual review
    let remediation = "MANUAL_REVIEW";

    const hasDebit = legs.some((x) => x.type === "debit");
    const hasCredit = legs.some((x) => x.type === "credit");
    const hasReversal = legs.some((x) => x.type === "reversal");

    if (hasDebit && !hasCredit && !hasReversal) {
      remediation = "ENQUEUE_RETRY_CREDIT";
      await enqueueRemediation(r.reference, "DEBIT_NO_CREDIT");
      // Update Transaction rows to mark as PENDING_RETRY (optional)
      await Transaction.update(
        { status: Status.FAILED },
        { where: { reference: r.reference, type: "debit" } }
      );
    } else if (hasDebit && hasCredit && r.debit_sum !== r.credit_sum) {
      remediation = "MANUAL_REVIEW_AMOUNT_MISMATCH";
    } else if (!hasDebit && hasCredit) {
      remediation = "MANUAL_REVIEW_CREDIT_ONLY";
    } else if (hasReversal) {
      remediation = "MANUAL_REVIEW_REVERSAL_PRESENT";
    } else {
      remediation = "MANUAL_REVIEW";
    }

    exceptionsDetailed.push({
      reference: r.reference,
      issues: r.issues,
      debit_sum: r.debit_sum,
      credit_sum: r.credit_sum,
      legs: legSummary,
      remediation
    });
  }

  return exceptionsDetailed;
}

async function generateCsvReport(exceptionsDetailed: any[], filename: string) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Flatten for CSV
  const rows = exceptionsDetailed.map((e) => ({
    reference: e.reference,
    issues: e.issues,
    debit_sum: e.debit_sum,
    credit_sum: e.credit_sum,
    remediation: e.remediation,
    legs: JSON.stringify(e.legs)
  }));

  const csv = csvStringify.stringify(rows, { header: true });
  const outPath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(outPath, csv, "utf8");
  return outPath;
}

async function sendAlertEmail(csvPath: string, exceptionCount: number) {
  if (!ALERT_EMAIL_TO) {
    console.log("No alert email configured; skipping email.");
    return;
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "recon@example.com",
    to: ALERT_EMAIL_TO,
    subject: `[RECON] ${exceptionCount} transaction exceptions detected`,
    text: `There are ${exceptionCount} transaction exceptions. See attached report.`,
    attachments: [
      {
        filename: path.basename(csvPath),
        path: csvPath
      }
    ]
  });

  console.log("Alert email sent:", info.accepted);
}

export async function runReconciliation() {
  console.log("Starting reconciliation job:", new Date().toISOString());
  try {
    const exceptions = await detectExceptions(2000);
    console.log(`Found ${exceptions.length} exception references.`);

    if (exceptions.length === 0) {
      console.log("No exceptions found. Exiting.");
      return;
    }

    const detailed = await investigateAndRemediate(exceptions);
    const nowStr = new Date().toISOString().replace(/[:.]/g, "-");
    const csvPath = await generateCsvReport(detailed, `recon-${nowStr}.csv`);
    console.log("Report generated:", csvPath);

    await sendAlertEmail(csvPath, detailed.length);

    console.log("Reconciliation job completed.");
  } catch (err) {
    console.error("Reconciliation job failed:", err);
  }
}

// If run directly
if (require.main === module) {
  runReconciliation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
