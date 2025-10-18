/**
 * To ensure consistency, create a helper function for inserting logs
 * and computing the hash
 */
import AuditLog from "./auditLog";
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
  const dataString = JSON.stringify({ oldData, newData });
  const hash = crypto.createHash("sha256").update(dataString).digest("hex");

  await AuditLog.create({
    tableName,
    recordId,
    operation,
    oldData: oldData || null,
    newData: newData || null,
    executedBy: executedBy || "system",
    recordHash: hash
  });
}
