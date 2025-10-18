/**
 * This is the daily integrity verification job.
It verifies:
Every record’s hash = recomputed hash
Each previousHash = previous record’s recordHash
No missing IDs (sequence gaps)
*/

// jobs/verifyAuditChain.ts
import AuditLog from "../models/auditLog";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function verifyAuditChain() {
  const records = await AuditLog.findAll({
    order: [["id", "ASC"]],
    raw: true
  });

  const issues: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const current = records[i];
    const previous = records[i - 1];

    if (!current) continue; // <--ensures current is defined

    // 1. Recompute hash
    const dataString = JSON.stringify({
      tableName: current.tableName,
      recordId: current.recordId,
      operation: current.operation,
      oldData: current.oldData,
      newData: current.newData
    });
    const recalculatedHash = crypto
      .createHash("sha256")
      .update(dataString)
      .digest("hex");

    if (current.recordHash !== recalculatedHash) {
      issues.push(`Tampered hash at ID ${current.id}`);
    }

    // 2. Verify chain integrity
    if (previous && current.previousHash !== previous.recordHash) {
      issues.push(`Chain broken between ID ${previous.id} and ${current.id}`);
    }

    // 3. Detect missing sequence
    if (previous && current.id !== previous.id + 1) {
      issues.push(`Missing audit ID between ${previous.id} and ${current.id}`);
    }
  }

  if (issues.length === 0) {
    console.log("Audit log chain verified — no tampering detected.");
  } else {
    console.error("Audit integrity issues found:");
    issues.forEach((i) => console.error(i));
    await alertSecurityTeam(issues);
  }

  return issues;
}

// Simple notification (email to Audit/Security)
async function alertSecurityTeam(issues: string[]) {
  const transporter = nodemailer.createTransport({
    host: "smtp.yourbank.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AUDIT_ALERT_USER,
      pass: process.env.AUDIT_ALERT_PASS
    }
  });

  await transporter.sendMail({
    from: '"Audit Integrity Monitor" <audit-monitor@yourbank.com>',
    to: "security@yourbank.com, audit@yourbank.com",
    subject: "Audit Log Integrity Alert",
    text: `Integrity verification failed:\n\n${issues.join("\n")}`
  });
}
