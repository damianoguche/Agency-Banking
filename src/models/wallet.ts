import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../config/db.ts";
import { Currency, WalletType } from "../types/wallet.ts";
import { Customer } from "./customer.ts";
import bcrypt from "bcryptjs";

// Wallet model
interface WalletAttributes {
  id: number;
  walletNumber: string;
  balance: number;
  currency: Currency;
  customerId: number;
  walletType: WalletType;
  pinHash: string;
  pinAttempts: number;
  isLocked: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface WalletCreationAttributes
  extends Optional<
    WalletAttributes,
    | "id"
    | "balance"
    | "currency"
    | "created_at"
    | "updated_at"
    | "pinHash"
    | "isLocked"
    | "pinAttempts"
  > {}

class Wallet
  extends Model<WalletAttributes, WalletCreationAttributes>
  implements WalletAttributes
{
  declare id: number;
  declare walletNumber: string;
  declare balance: number;
  declare currency: Currency;
  declare customerId: number;
  declare walletType: WalletType;
  declare pinHash: string;
  declare pinAttempts: number;
  declare isLocked: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;

  // Make TS know about the association
  declare customer?: Customer;
}

Wallet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    walletNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    pinHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pinAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    currency: {
      type: DataTypes.ENUM(...Object.values(Currency)),
      allowNull: false,
      defaultValue: Currency.NGN
    },
    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "customers", key: "id" }
    },
    walletType: {
      type: DataTypes.ENUM(...Object.values(WalletType)),
      allowNull: false,
      defaultValue: WalletType.SAVINGS
    },
    created_at: {
      //DB-level fallback
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
    modelName: "Wallet",
    tableName: "wallets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        // enforce 1 wallet type per customer
        unique: true,
        fields: ["customerId", "walletType", "currency", "walletNumber"]
      }
    ]
  }
);

// Hash PIN before saving
Wallet.beforeCreate(async (wallet) => {
  if (wallet.pinHash) {
    wallet.pinHash = await bcrypt.hash(wallet.pinHash, 12);
  }
});

export default Wallet;
