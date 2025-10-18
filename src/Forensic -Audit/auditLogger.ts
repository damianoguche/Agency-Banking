/**
 * Update Audit Creation Utility
 * Add chaining support:
 * The new record will link to the hash of the last record in the table
 */

import AuditLog from "./models/auditLog";
import crypto from "crypto";

export async function createAuditLog({
  tableName,
  recordId,
  operation,
  oldData,
  newData,
  executedBy
}: {
  tableName: string;
  recordId: number;
  operation: "INSERT" | "UPDATE" | "DELETE";
  oldData?: object | null;
  newData?: object | null;
  executedBy?: string | null;
}) {
  const lastLog = await AuditLog.findOne({
    order: [["id", "DESC"]],
    attributes: ["recordHash"]
  });

  const dataString = JSON.stringify({
    tableName,
    recordId,
    operation,
    oldData,
    newData
  });

  const recordHash = crypto
    .createHash("sha256")
    .update(dataString)
    .digest("hex");
  const previousHash = lastLog?.recordHash || null;

  await AuditLog.create({
    tableName,
    recordId,
    operation,
    oldData: oldData || null,
    newData: newData || null,
    executedBy: executedBy || "system",
    recordHash,
    previousHash
  });
}
