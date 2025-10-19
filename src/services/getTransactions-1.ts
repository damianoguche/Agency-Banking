import { Transaction, QueryTypes } from "sequelize";
import TransactionHistory from "../models/transaction.ts";
import Wallet from "../models/wallet.ts";
import sequelize from "../config/db.ts";

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
        order: [["created_at", "DESC"]],
        offset,
        limit,
        transaction: t
      });

      // Ledger Consistency Check using Raw SQL
      const query = `
        SELECT 
           wallet_number,
           SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END) AS computed_balance
        FROM ledger_entries
        GROUP BY wallet_number
        HAVING computed_balance <> (
        SELECT balance FROM wallets WHERE wallets.walletNumber = ledger_entries.wallet_number);
       `;

      const inconsistencies = await sequelize.query(query, {
        replacements: { walletNumber },
        type: QueryTypes.SELECT,
        transaction: t
      });

      if (inconsistencies.length > 0) {
        throw new Error(
          `Ledger inconsistency detected for wallet ${walletNumber}`
        );
      }

      return { wallet, transactions };
    }
  );
}
