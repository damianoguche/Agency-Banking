import { Customer } from "./customer.ts";
import { LedgerEntry } from "./ledger.ts";
import TransactionHistory from "./transaction.ts";
import Wallet from "./wallet.ts";
import sequelize from "../config/db.ts";

// Associations are defined after all models are imported
// Both sides must use the same foreign key to establish a link.
// The as: "customer" alias allows you to use wallet.customer
// The as: "wallets" alias allows you to use customer.wallets.

// Associations
Customer.hasMany(Wallet, {
  foreignKey: "customerId",
  as: "wallets",
  onDelete: "CASCADE"
});

Wallet.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer"
});

Wallet.hasMany(TransactionHistory, {
  foreignKey: "walletId",
  as: "transactions"
});

TransactionHistory.belongsTo(Wallet, {
  foreignKey: "walletId",
  as: "wallet"
});

// Optional transfer relationships
TransactionHistory.belongsTo(Wallet, {
  foreignKey: "senderWalletId",
  as: "senderWallet"
});
TransactionHistory.belongsTo(Wallet, {
  foreignKey: "receiverWalletId",
  as: "receiverWallet"
});

TransactionHistory.hasMany(LedgerEntry, {
  foreignKey: "transaction_reference",
  sourceKey: "reference",
  onDelete: "CASCADE"
});

LedgerEntry.belongsTo(TransactionHistory, {
  foreignKey: "transaction_reference",
  targetKey: "reference"
});

export { sequelize, Customer, Wallet, TransactionHistory, LedgerEntry };
