import { Customer } from "./customer.ts";
import TransactionHistory from "./transaction.ts";
import Wallet from "./wallet.ts";

// Associations are defined after all models are imported
// Both sides must use the same foreign key to establish a link.
// The as: "customer" alias allows you to use wallet.customer
// The as: "wallets" alias allows you to use customer.wallets.
Customer.hasMany(Wallet, {
  foreignKey: "customerId",
  as: "wallets",
  onDelete: "CASCADE" // if customer is deleted, delete wallets
});

Wallet.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer"
});

Wallet.hasMany(TransactionHistory, {
  foreignKey: "walletId",
  as: "transactions"
});

TransactionHistory.belongsTo(Wallet, { foreignKey: "walletId", as: "wallet" });

// Optional: for transfers
TransactionHistory.belongsTo(Wallet, {
  foreignKey: "senderWalletId",
  as: "senderWallet"
});

TransactionHistory.belongsTo(Wallet, {
  foreignKey: "receiverWalletId",
  as: "receiverWallet"
});

export { Customer, Wallet, TransactionHistory };
