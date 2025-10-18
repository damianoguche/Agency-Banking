/**
 * Apply Audit Hooks on Wallet Model
 * Integrate it into an existing Wallet model:
 */
import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../../config/db.ts";
import { createAuditLog } from "../auditLogger";

interface WalletAttributes {
  id: number;
  walletNumber: string;
  balance: number;
  customerId: number;
  lastUpdatedBy?: string | null;
}

interface WalletCreationAttributes
  extends Optional<WalletAttributes, "id" | "balance"> {}

class Wallet
  extends Model<WalletAttributes, WalletCreationAttributes>
  implements WalletAttributes
{
  declare id: number;
  declare walletNumber: string;
  declare balance: number;
  declare customerId: number;
  declare lastUpdatedBy?: string | null;
}

Wallet.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    walletNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    balance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0
    },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    lastUpdatedBy: { type: DataTypes.STRING }
  },
  { sequelize, modelName: "Wallet", tableName: "wallets" }
);

// Sequelize Hooks for Audit Logging
Wallet.addHook("afterCreate", async (wallet: Wallet, options) => {
  await createAuditLog({
    tableName: "wallets",
    recordId: wallet.id,
    operation: "INSERT",
    newData: wallet.toJSON(),
    executedBy: wallet.lastUpdatedBy || "system"
  });
});

Wallet.addHook("beforeUpdate", async (wallet: Wallet, options) => {
  const previous = await Wallet.findByPk(wallet.id);
  await createAuditLog({
    tableName: "wallets",
    recordId: wallet.id,
    operation: "UPDATE",
    oldData: previous?.toJSON() || null,
    newData: wallet.toJSON(),
    executedBy: wallet.lastUpdatedBy || "system"
  });
});

Wallet.addHook("beforeDestroy", async (wallet: Wallet, options) => {
  await createAuditLog({
    tableName: "wallets",
    recordId: wallet.id,
    operation: "DELETE",
    oldData: wallet.toJSON(),
    executedBy: wallet.lastUpdatedBy || "system"
  });
});

export default Wallet;
