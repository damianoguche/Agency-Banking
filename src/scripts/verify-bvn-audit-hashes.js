/**
 * verify-bvn-audit-hashes.js
 *
 * Recomputes SHA256 hashes for bvn_audit_log and bvn_audit_archive
 * records, compares them to stored record_hash values, and alerts
 * via Slack and/or email if any mismatches are found.
 *
 * Usage: node verify-bvn-audit-hashes.js
 *
 * Shows the operational monitoring layer of your forensic control
 * system — turning compliance into continuous assurance.
 */

require("dotenv").config();

const mysql = require("mysql2/promise");
const crypto = require("crypto");
const fetch = require("node-fetch"); // or use axios if you prefer
const nodemailer = require("nodemailer");

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  SLACK_WEBHOOK_URL,
  ALERT_EMAIL_TO,
  ALERT_EMAIL_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAX_ROWS_TO_CHECK
} = process.env;

// default safety limits
const MAX_CHECK = parseInt(MAX_ROWS_TO_CHECK || "10000", 10);

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error("Missing DB connection details. Check environment variables.");
  process.exit(2);
}

async function connectDb() {
  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT ? parseInt(DB_PORT, 10) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
}

/**
 * Recreate the same string the DB trigger used to compute SHA2:
 *   CONCAT(IFNULL(customer_id,''), IFNULL(attempted_bvn,''), IFNULL(operation_type,''),
 *          IFNULL(attempted_by,''), IFNULL(ip_address,''), DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'))
 *
 * Note: created_at must be formatted exactly like DATE_FORMAT(..., '%Y-%m-%d %H:%i:%s')
 */
function computeHashForRow(row) {
  // Ensure we mirror DB's DATE_FORMAT behaviour
  const createdAt = row.created_at ? formatDateForTrigger(row.created_at) : "";
  const parts = [
    row.customer_id == null ? "" : String(row.customer_id),
    row.attempted_bvn == null ? "" : String(row.attempted_bvn),
    row.operation_type == null ? "" : String(row.operation_type),
    row.attempted_by == null ? "" : String(row.attempted_by),
    row.ip_address == null ? "" : String(row.ip_address),
    createdAt
  ];
  const concat = parts.join("");
  const hash = crypto.createHash("sha256").update(concat, "utf8").digest("hex");
  return hash;
}

// Format JS Date/DB DATETIME to 'YYYY-MM-DD HH:mm:ss'
function formatDateForTrigger(d) {
  // d might be a JS Date instance or a mysql2 Date string — normalize
  const dt = d instanceof Date ? d : new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function queryRows(pool, table, limit = MAX_CHECK) {
  const sql = `SELECT id, customer_id, attempted_bvn, operation_type, attempted_by, ip_address, created_at, record_hash
               FROM ${table}
               ORDER BY id ASC
               LIMIT ?`;
  const [rows] = await pool.query(sql, [limit]);
  return rows;
}

async function sendSlackAlert(text) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        attachments: [
          {
            color: "danger",
            text
          }
        ]
      })
    });
  } catch (err) {
    console.error("Failed to send Slack alert:", err.message);
  }
}

async function sendEmailAlert(subject, htmlBody) {
  if (!SMTP_HOST || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) return;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_PORT === "465", // true for 465, false for other ports
      auth: SMTP_USER
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        : undefined
    });

    await transporter.sendMail({
      from: ALERT_EMAIL_FROM,
      to: ALERT_EMAIL_TO,
      subject,
      html: htmlBody
    });
  } catch (err) {
    console.error("Failed to send email alert:", err.message);
  }
}

function summarizeMismatches(mismatches, tableName) {
  // create a short list (id, customer_id, attempted_bvn)
  return mismatches
    .slice(0, 50)
    .map(
      (m) =>
        `id=${m.id} customer_id=${m.customer_id} attempted_bvn=${m.attempted_bvn}`
    )
    .join("\n");
}

async function runCheck() {
  const pool = await connectDb();

  try {
    const tables = ["bvn_audit_log", "bvn_audit_archive"];
    const allMismatches = [];

    for (const table of tables) {
      // If table doesn't exist, skip
      try {
        const [exists] = await pool.query(`SHOW TABLES LIKE ?`, [table]);
        if ((exists || []).length === 0) {
          console.warn(`Table ${table} does not exist — skipping.`);
          continue;
        }
      } catch (err) {
        console.warn(`Could not check existence of ${table}:`, err.message);
        continue;
      }

      const rows = await queryRows(pool, table);
      console.log(
        `Checking ${rows.length} rows in ${table} (limit ${MAX_CHECK})`
      );

      const mismatches = [];

      for (const row of rows) {
        const computed = computeHashForRow(row);
        const stored = row.record_hash
          ? String(row.record_hash).toLowerCase()
          : null;
        if (!stored || computed !== stored.toLowerCase()) {
          mismatches.push({
            table,
            id: row.id,
            customer_id: row.customer_id,
            attempted_bvn: row.attempted_bvn,
            operation_type: row.operation_type,
            attempted_by: row.attempted_by,
            ip_address: row.ip_address,
            created_at: formatDateForTrigger(row.created_at),
            stored_hash: stored,
            computed_hash: computed
          });
        }
      }

      if (mismatches.length) {
        console.error(`${mismatches.length} mismatches found in ${table}`);
        allMismatches.push(...mismatches);
      } else {
        console.log(`No mismatches in ${table}`);
      }
    } // tables loop

    if (allMismatches.length > 0) {
      // Build alert message
      const subject = `ALERT: BVN audit log integrity check FAILED (${allMismatches.length} mismatches)`;
      const shortList = allMismatches.slice(0, 200); // cap for email body
      const htmlBody = `
        <p><strong>BVN Audit Log Integrity Check</strong></p>
        <p>Detected <strong>${
          allMismatches.length
        }</strong> mismatched records across audit tables.</p>
        <pre>${JSON.stringify(shortList, null, 2)}</pre>
        <p>First 20 mismatches summary:</p>
        <pre>${summarizeMismatches(allMismatches.slice(0, 20), null)}</pre>
        <p>Investigation recommended immediately.</p>
      `;

      const slackText = `:rotating_light: *BVN Audit Integrity FAILURE*: ${allMismatches.length} mismatches detected. Check email for details.`;

      await Promise.all([
        sendSlackAlert(slackText),
        sendEmailAlert(subject, htmlBody)
      ]);

      // Optionally, write a compact CSV to disk for automated forensic ingestion
      const csvLines = [
        "table,id,customer_id,attempted_bvn,operation_type,attempted_by,ip_address,created_at,stored_hash,computed_hash",
        ...allMismatches.map((m) =>
          [
            m.table,
            m.id,
            `"${(m.customer_id ?? "").toString().replace(/"/g, '""')}"`,
            `"${(m.attempted_bvn ?? "").toString().replace(/"/g, '""')}"`,
            m.operation_type,
            `"${(m.attempted_by ?? "").toString().replace(/"/g, '""')}"`,
            m.ip_address,
            m.created_at,
            m.stored_hash ?? "",
            m.computed_hash
          ].join(",")
        )
      ].join("\n");

      const fs = require("fs");
      const outPath = `./bvn_integrity_mismatches_${Date.now()}.csv`;
      fs.writeFileSync(outPath, csvLines, "utf8");
      console.log(`Wrote mismatch CSV to ${outPath}`);

      // Exit non-zero for monitoring systems to pick up
      process.exit(3);
    } else {
      // No mismatches
      console.log("All audit hashes verified successfully.");
      process.exit(0);
    }
  } catch (err) {
    console.error("Error during integrity check:", err);
    await sendSlackAlert(
      `:x: BVN audit integrity check script failed: ${err.message}`
    );
    process.exit(4);
  } finally {
    // pool.end returns a promise
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
}

runCheck();
