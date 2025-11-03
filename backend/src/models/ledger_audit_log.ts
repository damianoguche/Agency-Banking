import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.ts";

export class LedgerAuditLog extends Model {
  declare id: number;
  declare walletId: number;
  declare computed_balance: number;
  declare actual_balance: number;
  declare difference: number;
  declare status: "inconsistent" | "consistent";
  declare review_status: "pending" | "under_review" | "resolved";
  declare reviewed_by: string | null;
  declare resolution_notes: string | null;
  declare resolved_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

LedgerAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    walletId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    computed_balance: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    actual_balance: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    difference: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("consistent", "inconsistent"),
      defaultValue: "inconsistent"
    },
    review_status: {
      type: DataTypes.ENUM("pending", "under_review", "resolved"),
      defaultValue: "pending"
    },
    reviewed_by: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      // DB-level fallback
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: "LedgerAuditLog",
    tableName: "ledger_audit_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
