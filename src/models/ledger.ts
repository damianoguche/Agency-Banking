import { Model, DataTypes } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../config/db.ts";
import TransactionHistory from "./transaction.ts";

interface LedgerEntryAttributes {
  id: number;
  transaction_reference: string;
  wallet_number: string;
  entry_type: "DEBIT" | "CREDIT";
  amount: number;
}

interface LedgerEntryCreationAttributes
  extends Optional<LedgerEntryAttributes, "id"> {}

export class LedgerEntry
  extends Model<LedgerEntryAttributes, LedgerEntryCreationAttributes>
  implements LedgerEntryAttributes
{
  declare id: number;
  declare transaction_reference: string;
  declare wallet_number: string;
  declare entry_type: "DEBIT" | "CREDIT";
  declare amount: number;
}

LedgerEntry.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    transaction_reference: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: TransactionHistory,
        key: "reference"
      }
    },
    wallet_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entry_type: {
      type: DataTypes.ENUM("DEBIT", "CREDIT"),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "LedgerEntry",
    tableName: "ledger_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["entry_type", "wallet_number", "transaction_reference"]
      }
    ]
  }
);
