import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../config/db.ts";
import { Status } from "../types/status.ts";
import { Type } from "../types/transaction_types.ts";

//Transaction Model (with typing)
interface TransactionAttributes {
  id: number;
  walletNumber: string;
  type: Type;
  amount: number;
  reference: string;
  narration?: string;
  senderWalletNumber?: string;
  receiverWalletNumber?: string;
  status: Status;
  created_at: Date;
  updated_at: Date;
}

interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    | "id"
    | "walletNumber"
    | "status"
    | "narration"
    | "senderWalletNumber"
    | "receiverWalletNumber"
    | "created_at"
    | "updated_at"
  > {}

class TransactionHistory
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: number;
  declare walletNumber: string;
  declare type: Type;
  declare amount: number;
  declare reference: string;
  declare narration?: string;
  declare status: Status;
  declare senderWalletNumber?: string;
  declare receiverWalletNumber?: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

// Initialize and register model in Sequelize, makes this model
// actually connect to the database(maps to the transactions table in
// the database.)
TransactionHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    walletNumber: { type: DataTypes.STRING, allowNull: true },
    type: {
      type: DataTypes.ENUM(...Object.values(Type)),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    narration: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM(...Object.values(Status)),
      allowNull: true,
      defaultValue: Status.PENDING
    },
    senderWalletNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receiverWalletNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
    modelName: "TransactionHistory",
    tableName: "transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

export default TransactionHistory;
