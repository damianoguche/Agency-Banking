/**
 * remediate-create-forensic-snapshot.js
 *
 * Usage:
 *   node remediate-create-forensic-snapshot.js --csv ./bvn_integrity_mismatches_167xxxx.csv
 *
 * This script:
 *  - Loads mismatch file (CSV produced by the verifier) OR accepts a JSON of mismatches,
 *  - Fetches the full, authoritative DB rows for the mismatched IDs from bvn_audit_log and bvn_audit_archive,
 *  - Produces snapshot files (CSV + JSON) + a small manifest with checksums,
 *  - Compresses into a single tar.gz,
 *  - Uploads to S3 with Object Lock retention and optional legal hold,
 *  - Optionally writes a local write-once copy and applies chattr +i (Linux),
 *  - Sends Slack and Email notifications with links and checksums.
 *
 * Environment variables (see .env.example below)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const crypto = require("crypto");
const csvParse = require("csv-parse/lib/sync");
const csvStringify = require("csv-stringify/lib/sync");
const archiver = require("archiver"); // to create zip/tar (install)
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

// AWS SDK v3
const {
  S3Client,
  PutObjectCommand,
  PutObjectRetentionCommand,
  PutObjectLegalHoldCommand
} = require("@aws-sdk/client-s3");

// ---- env / config ----
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  S3_BUCKET,
  S3_REGION,
  S3_PREFIX,
  S3_OBJECT_LOCK_MODE, // "GOVERNANCE" | "COMPLIANCE"
  S3_RETENTION_DAYS, // integer
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  SLACK_WEBHOOK_URL,
  ALERT_EMAIL_TO,
  ALERT_EMAIL_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  LOCAL_FORensic_DIR,
  APPLY_LOCAL_IMMUTABILITY // "true" to attempt chattr +i
} = process.env;

// Basic validations
if (!S3_BUCKET || !S3_REGION) {
  console.error(
    "S3_BUCKET and S3_REGION must be set in environment variables."
  );
  process.exit(2);
}

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error("DB connection info missing in environment variables.");
  process.exit(2);
}

// AWS client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials:
    AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

// parse args
const argv = require("minimist")(process.argv.slice(2));
const csvPath = argv.csv || argv.file || null;
const jsonPath = argv.json || null;
if (!csvPath && !jsonPath) {
  console.error(
    "Usage: node remediate-create-forensic-snapshot.js --csv <mismatch.csv> OR --json <mismatches.json>"
  );
  process.exit(2);
}

// helper: sha256 of file
function fileSha256Hex(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

// helper: make timestamped filename
function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// parse mismatch CSV (expecting columns: table,id,...)
function parseMismatchCSV(csvFile) {
  const txt = fs.readFileSync(csvFile, "utf8");
  const rows = csvParse(txt, { columns: true, skip_empty_lines: true });
  // Map: { table: [ids...] }
  const map = {};
  for (const r of rows) {
    const table = r.table || r.Table || r.source_table || "bvn_audit_log";
    const id = r.id || r.ID || r.record_id;
    if (!id) continue;
    if (!map[table]) map[table] = new Set();
    map[table].add(Number(id));
  }
  // return as { tableName: [ids] }
  for (const k of Object.keys(map)) map[k] = Array.from(map[k]);
  return map;
}

// parse mismatch JSON (expected array of objects with table and id)
function parseMismatchJSON(jsonFile) {
  const txt = fs.readFileSync(jsonFile, "utf8");
  const arr = JSON.parse(txt);
  const map = {};
  for (const r of arr) {
    const table = r.table || r.tableName || "bvn_audit_log";
    const id = r.id;
    if (!id) continue;
    if (!map[table]) map[table] = new Set();
    map[table].add(Number(id));
  }
  for (const k of Object.keys(map)) map[k] = Array.from(map[k]);
  return map;
}

// fetch full rows for given table and ids
async function fetchRowsByIds(pool, table, ids) {
  if (!ids || ids.length === 0) return [];
  // parameterize IN clause safely
  const placeholders = ids.map(() => "?").join(",");
  const sql = `SELECT * FROM ${table} WHERE id IN (${placeholders})`;
  const [rows] = await pool.query(sql, ids);
  return rows;
}

// create a temporary working dir
function mkWorkDir() {
  const base = process.cwd();
  const dir = path.join(base, `forensic_snapshot_${ts()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// create CSV from rows
function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return "";
  // ensure consistent column order
  const cols = Object.keys(rows[0]);
  return csvStringify(rows, { header: true, columns: cols });
}

// create JSON
function rowsToJSON(rows) {
  return JSON.stringify(rows, null, 2);
}

// compress directory to tar.gz using archiver
async function createArchive(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("tar", { gzip: true, gzipOptions: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// upload file to S3 with object lock retention and optional legal hold
async function uploadToS3(localPath, key, options = {}) {
  const body = fs.createReadStream(localPath);
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    Metadata: options.metadata || {}
  };

  // Put object first
  await s3Client.send(new PutObjectCommand(params));

  // Then set retention (PutObjectRetention) if requested
  if (options.retentionDays && Number(options.retentionDays) > 0) {
    const retentionUntil = new Date();
    retentionUntil.setDate(
      retentionUntil.getDate() + Number(options.retentionDays)
    );

    const retentionParams = {
      Bucket: S3_BUCKET,
      Key: key,
      Retention: {
        Mode:
          S3_OBJECT_LOCK_MODE === "COMPLIANCE" ? "COMPLIANCE" : "GOVERNANCE",
        RetainUntilDate: retentionUntil.toISOString() // AWS expects ISO
      }
    };
    await s3Client.send(new PutObjectRetentionCommand(retentionParams));
  }

  // Optionally apply legal hold
  if (options.legalHold === true) {
    const holdParams = {
      Bucket: S3_BUCKET,
      Key: key,
      LegalHold: { Status: "ON" }
    };
    await s3Client.send(new PutObjectLegalHoldCommand(holdParams));
  }

  return `s3://${S3_BUCKET}/${key}`;
}

// slack notifier
async function notifySlack(text) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error("Slack notify failed:", err.message);
  }
}

// email notifier
async function notifyEmail(subject, bodyHtml) {
  if (!SMTP_HOST || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) return;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_PORT === "465",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    });
    await transporter.sendMail({
      from: ALERT_EMAIL_FROM,
      to: ALERT_EMAIL_TO,
      subject,
      html: bodyHtml
    });
  } catch (err) {
    console.error("Email notify failed:", err.message);
  }
}

// attempt to set immutable bit on file (Linux ext4: chattr +i)
function tryLocalImmutable(filePath) {
  if (APPLY_LOCAL_IMMUTABILITY !== "true") return false;
  try {
    const result = spawnSync("chattr", ["+i", filePath], { stdio: "inherit" });
    if (result.status !== 0) {
      console.warn(
        "Failed to chattr +i (maybe not root):",
        result.error || result.status
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn("chattr attempt failed:", err.message);
    return false;
  }
}

// main
(async function main() {
  let mismatchMap;
  try {
    if (csvPath) mismatchMap = parseMismatchCSV(csvPath);
    else mismatchMap = parseMismatchJSON(jsonPath);
  } catch (err) {
    console.error("Failed to parse mismatch input:", err.message);
    process.exit(3);
  }

  // DB connect
  const pool = await mysql.createPool({
    host: DB_HOST,
    port: DB_PORT ? parseInt(DB_PORT, 10) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
  });

  // create working dir
  const workDir = mkWorkDir();
  console.log("Working dir:", workDir);

  const manifest = {
    created_at: new Date().toISOString(),
    source_mismatch_file: csvPath || jsonPath,
    tables: {}
  };

  try {
    // iterate tables and gather full rows
    for (const [table, ids] of Object.entries(mismatchMap)) {
      const safeTable = table.trim();
      const rows = await fetchRowsByIds(pool, safeTable, ids);
      // write rows as JSON and CSV
      const jsonFile = path.join(workDir, `${safeTable}_rows.json`);
      const csvFile = path.join(workDir, `${safeTable}_rows.csv`);
      fs.writeFileSync(jsonFile, rowsToJSON(rows), "utf8");
      fs.writeFileSync(csvFile, rowsToCSV(rows), "utf8");

      // compute checksums
      const jsonHash = fileSha256Hex(jsonFile);
      const csvHash = fileSha256Hex(csvFile);

      manifest.tables[safeTable] = {
        row_count: rows.length,
        json_file: path.basename(jsonFile),
        csv_file: path.basename(csvFile),
        json_sha256: jsonHash,
        csv_sha256: csvHash
      };
    }

    // also copy the original mismatch CSV/JSON into the snapshot
    const originalCopy = path.join(workDir, path.basename(csvPath || jsonPath));
    fs.copyFileSync(csvPath || jsonPath, originalCopy);
    manifest.original_mismatch_file = path.basename(originalCopy);
    manifest.original_sha256 = fileSha256Hex(originalCopy);

    // write manifest file
    const manifestPath = path.join(workDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    const manifestHash = fileSha256Hex(manifestPath);
    manifest.manifest_sha256 = manifestHash;

    // compress the workDir to tar.gz
    const archiveName = `forensic_snapshot_${ts()}.tar.gz`;
    const archivePath = path.join(process.cwd(), archiveName);
    await createArchive(workDir, archivePath);
    const archiveHash = fileSha256Hex(archivePath);

    // local copy (optionally immutable)
    if (LOCAL_FORensic_DIR) {
      try {
        fs.mkdirSync(LOCAL_FORensic_DIR, { recursive: true });
        const localPath = path.join(LOCAL_FORensic_DIR, archiveName);
        fs.copyFileSync(archivePath, localPath);
        console.log("Local copy written to", localPath);
        if (tryLocalImmutable(localPath)) {
          console.log("Applied local immutability (chattr +i) to", localPath);
        } else {
          console.warn(
            "Could not apply local immutability. Ensure you have root or run chattr manually."
          );
        }
      } catch (err) {
        console.warn("Local copy attempt failed:", err.message);
      }
    }

    // Upload to S3 with object lock retention
    const s3Key = `${
      S3_PREFIX ? S3_PREFIX.replace(/\/$/, "") + "/" : ""
    }${archiveName}`;
    console.log("Uploading snapshot to S3:", `s3://${S3_BUCKET}/${s3Key}`);
    const s3Uri = await uploadToS3(archivePath, s3Key, {
      retentionDays: S3_RETENTION_DAYS ? Number(S3_RETENTION_DAYS) : 365,
      legalHold: true,
      metadata: {
        manifest_sha256: manifestHash,
        archive_sha256: archiveHash
      }
    });

    // cleanup working dir (optional; you may want to keep it)
    // fs.rmdirSync(workDir, { recursive: true });

    // notify teams
    const subject = `Forensic snapshot created: ${archiveName} (s3://${S3_BUCKET}/${s3Key})`;
    const slackText = [
      `:lock: *Forensic Snapshot Created*`,
      `*File:* ${archiveName}`,
      `*S3 Location:* s3://${S3_BUCKET}/${s3Key}`,
      `*Manifest SHA256:* ${manifestHash}`,
      `*Archive SHA256:* ${archiveHash}`,
      `*Rows:* ${Object.values(manifest.tables).reduce(
        (s, t) => s + t.row_count,
        0
      )}`,
      `*Created At:* ${manifest.created_at}`
    ].join("\n");

    const emailBody = `
      <p>Forensic snapshot created and stored to <strong>s3://${S3_BUCKET}/${s3Key}</strong>.</p>
      <p><strong>Manifest SHA256:</strong> ${manifestHash}</p>
      <p><strong>Archive SHA256:</strong> ${archiveHash}</p>
      <p>Details:</p>
      <pre>${JSON.stringify(manifest, null, 2)}</pre>
      <p>Do not modify or delete this object. It is stored with Object Lock.</p>
    `;

    await Promise.all([
      notifySlack(slackText),
      notifyEmail(subject, emailBody)
    ]);
    console.log("Notified Slack and Email recipients.");

    // final exit success
    console.log("Forensic snapshot complete. Archive SHA256:", archiveHash);
    process.exit(0);
  } catch (err) {
    console.error("Remediation snapshot failed:", err);
    await notifySlack(`:x: Forensic snapshot job failed: ${err.message}`);
    process.exit(4);
  } finally {
    try {
      await pool.end();
    } catch (e) {}
  }
})();
