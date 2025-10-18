// models/auditLog.ts
import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../../../src/config/db.ts";

interface AuditLogAttributes {
  id: number;
  tableName: string;
  recordId: number;
  operation: string;
  oldData: object | null;
  newData: object | null;
  executedBy: string | null;
  executedAt: Date;
  recordHash: string;
  previousHash: string | null;
}

interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    "id" | "executedAt" | "recordHash" | "previousHash"
  > {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: number;
  declare tableName: string;
  declare recordId: number;
  declare operation: string;
  declare oldData: object | null;
  declare newData: object | null;
  declare executedBy: string | null;
  declare executedAt: Date;
  declare recordHash: string;
  declare previousHash: string | null;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tableName: { type: DataTypes.STRING, allowNull: false },
    recordId: { type: DataTypes.INTEGER, allowNull: false },
    operation: { type: DataTypes.STRING(10), allowNull: false },
    oldData: { type: DataTypes.JSONB },
    newData: { type: DataTypes.JSONB },
    executedBy: { type: DataTypes.STRING },
    executedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    recordHash: { type: DataTypes.TEXT },
    previousHash: { type: DataTypes.TEXT }
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: false
  }
);

export default AuditLog;
