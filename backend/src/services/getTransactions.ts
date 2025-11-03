/**
 * It requires two round-trips to the DB,
 * It assumes you can filter by wallet_number (not always present),
 * It’s less efficient for multiple wallets or larger reconciliations.
 */

import { Transaction } from "sequelize";
import TransactionHistory from "../models/transaction.ts";
import Wallet from "../models/wallet.ts";
import sequelize from "../config/db.ts";
import { LedgerEntry } from "../models/ledger.ts";

export async function getWalletTransactionsService(
  walletNumber: string,
  page = 1,
  limit = 20
) {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      const wallet = await Wallet.findOne({
        where: { walletNumber },
        transaction: t
      });

      if (!wallet) throw new Error("Wallet not found");

      const offset = (page - 1) * limit;
      const transactions = await TransactionHistory.findAll({
        where: { walletNumber },
        raw: true,
        order: [["created_at", "DESC"]],
        offset,
        limit,
        transaction: t
      });

      // Check ledger existence
      const entryCount = await LedgerEntry.count({
        where: { wallet_number: walletNumber },
        transaction: t
      });

      if (entryCount === 0) {
        console.warn(`No ledger entries found for wallet ${walletNumber}`);

        return {
          wallet,
          transactions
        };
      }

      // Ledger Consistency Check(Sum-by-type logic)
      const totalCredits = await LedgerEntry.sum("amount", {
        where: { wallet_number: walletNumber, entry_type: "CREDIT" },
        transaction: t
      });

      const totalDebits = await LedgerEntry.sum("amount", {
        where: { wallet_number: walletNumber, entry_type: "DEBIT" },
        transaction: t
      });

      if (!totalCredits && !totalDebits) {
        console.warn(`No ledger activity for wallet ${walletNumber}`);
        return { wallet, transactions, message: "No ledger entries yet" };
      }

      const hasOnlyCredits = totalCredits && !totalDebits;
      const hasOnlyDebits = totalDebits && !totalCredits;

      if (hasOnlyCredits || hasOnlyDebits) {
        console.warn(
          `Wallet ${walletNumber} has single-entry ledger (Credits: ${totalCredits}, Debits: ${totalDebits})`
        );
        // Return gracefully, don't throw
        return {
          wallet,
          transactions,
          computedBalance: (totalCredits || 0) - (totalDebits || 0),
          message: "Single-entry ledger detected; skipping strict validation"
        };
      }

      // Balance validation wallet.balance VS SUM(ledger_entry)
      const computedBalance = (totalCredits || 0) - (totalDebits || 0);
      if (computedBalance !== wallet.balance) {
        throw new Error("Ledger mismatch/inconsistency detected");
      }

      return { wallet, transactions };
    }
  );
}
