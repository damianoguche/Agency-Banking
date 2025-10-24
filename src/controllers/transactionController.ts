/**
 * Controllers should not handle business logic. They can be replaced
 * with another method. Controllers handle requests and delegate the
 * processing to other components.
 *
 * Keep controllers lightweight and decoupled from business logic to
 * allow for flexibility and easier replacement with alternative methods
 * or technologies.
 */

import type { Request, Response } from "express";
import Wallet from "../models/wallet.ts";
import { withdrawal } from "../util/debit.ts";
import TransactionHistory from "../models/transaction.ts";
import { randomUUID } from "crypto";
import { Status } from "../types/status.ts";
import { Type } from "../types/types.ts";
import { LedgerEntry } from "../models/ledger.ts";
import { withTxRetry } from "../util/retry.ts";
import Outbox from "../models/outbox.ts";
import { z } from "zod";
import { getWalletTransactionsService } from "../services/getTransactions.ts";

interface TransferRequestBody {
  senderWalletNumber: string;
  receiverWalletNumber: string;
  amount: number | string;
}

interface CreditRequestBody {
  walletNumber: string;
  narration: string;
  amount: number;
  reference: string;
}

interface DebitRequestBody {
  walletNumber: string;
  narration: string;
  amount: number;
  reference: string;
}

/**
 * The deposit & withdrawal workflow should:
 * - Accept an amount and transaction reference.
 * - Verify idempotency (no double processing of same reference).
 * - Execute inside a Sequelize transaction (atomic DB rollback if any
 * - step fails).
 * - Create both TransactionHistory + LedgerEntry entries.
 * - Update wallet balance.
 * - Commit only if all steps succeed.
 */

export const creditWallet = async (
  req: Request<{}, {}, CreditRequestBody>,
  res: Response
): Promise<Response> => {
  const { amount, narration } = req.body;
  const reference = req.body.reference ?? `CR-${randomUUID()}`;
  const sequelize = Wallet.sequelize!;

  const customer = (req as any).customer;

  if (!amount || amount <= 0)
    return res.status(400).json({ message: "Missing required fields!" });

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "Invalid amount entered." });
  }

  try {
    await withTxRetry(sequelize, async (t) => {
      // Always lock Wallet first
      const wallet = await Wallet.findOne({
        where: { customerId: customer.id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!wallet) {
        throw new Error("Wallet not found");
        //return res.status(404).json({ message: "Wallet not found" });
      }

      // Then check idempotency
      const existing = await TransactionHistory.findOne({
        where: { reference },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "Already processed", reference });
      }

      // Atomic increment
      await wallet.increment("balance", { by: amount, transaction: t });

      await TransactionHistory.create(
        {
          type: Type.DEPOSIT,
          amount: amountNum,
          reference,
          narration: narration || "Wallet credited",
          walletNumber: wallet.walletNumber,
          status: Status.SUCCESSFUL
        },
        { transaction: t }
      );

      await LedgerEntry.create(
        {
          transaction_reference: reference,
          wallet_number: wallet.walletNumber,
          entry_type: "CREDIT",
          amount
        },
        { transaction: t }
      );

      await Outbox.create(
        {
          aggregate_type: "Transaction",
          aggregate_id: reference,
          event_type: "WalletCredited",
          payload: {
            reference,
            wallNumber: wallet.walletNumber,
            amount,
            type: Type.DEPOSIT
          },
          published: false
        },
        { transaction: t }
      );

      return wallet;
    });

    // const updated = await Wallet.findOne({ where: { walletNumber: wallet.walletNumber } });

    return res.status(200).json({
      message: "Wallet credited"
    });
  } catch (err: any) {
    // Write reversal record for audit
    await TransactionHistory.create({
      reference: `${reference}-R`,
      type: Type.REVERSAL,
      amount,
      narration: `Reversal for ${reference}: ${err.message}`,
      status: Status.ROLLBACK
    });

    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ message: err.message });
  }
};

// Debit Wallet
export const debitWallet = async (
  req: Request<{}, {}, DebitRequestBody>,
  res: Response
): Promise<Response> => {
  const { walletNumber, amount, narration } = req.body;

  if (!walletNumber || !amount || !narration)
    return res.status(400).json({ message: "Missing required fields!" });

  const amount_num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(amount_num) || amount_num <= 0) {
    return res.status(400).json({ message: "Invalid amount entered." });
  }

  try {
    const { txn, wallet } = await withdrawal(
      walletNumber,
      amount_num,
      narration
    );

    return res.status(200).json({ message: "Wallet debited", txn, wallet });
  } catch (err: any) {
    const msg =
      err.message === "Wallet not found" || err.message === "Insufficient funds"
        ? err.message
        : "Transaction failed";
    return res.status(400).json({ message: msg });
  }
};

/**
 * Transfer funds between wallets
 * Ensures atomicity using Sequelize transactions.
 * Commits only if both debit & credit entries succeed.
 * Logs reversals properly if rollback occurs.
 */
export const transferFunds = async (
  req: Request<{}, {}, TransferRequestBody>,
  res: Response
): Promise<Response> => {
  const { senderWalletNumber, receiverWalletNumber, amount } = req.body || {};

  if (!senderWalletNumber || !receiverWalletNumber || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "Invalid transfer amount." });
  }

  // Start a new database transaction session and the transaction
  // object(t) reprents active transaction connection.
  // Instead of the global sequelize instance, accessing it from
  // the model. Every Sequelize model keeps a reference to the Sequelize
  // instance that created it.
  // const t = await Wallet.sequelize!.transaction({
  //   isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
  // });

  let senderWallet, receiverWallet;
  const reference = `TX-${randomUUID()}`;
  const sequelize = Wallet.sequelize;

  /**
   * The variable t isn’t declared inside the controller, because it’s
   * actually passed automatically into the callback by the helper function
   * withTxRetry() — where the transaction is created.
   */

  try {
    await withTxRetry(
      sequelize,
      async (t) => {
        senderWallet = await Wallet.findOne({
          where: { walletNumber: senderWalletNumber },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        receiverWallet = await Wallet.findOne({
          where: { walletNumber: receiverWalletNumber },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!senderWallet || !receiverWallet)
          return res.status(404).json({ message: "Wallet not found" });

        if (senderWallet.id === receiverWallet.id)
          return res.status(400).json("Cannot transfer to self");

        if (senderWallet.balance < amountNum)
          return res.status(400).json({ message: "Insufficient funds" });

        // Perform atomic balance updates
        senderWallet.balance -= amountNum;
        receiverWallet.balance += amountNum;

        // Persist balances AND create transaction + ledger entries inside single atomic tx
        await senderWallet.save({ transaction: t });
        await receiverWallet.save({ transaction: t });

        // Create Master transaction
        const tx = await TransactionHistory.create(
          {
            type: Type.TRANSFER,
            amount: amountNum,
            reference,
            senderWalletNumber: senderWallet.walletNumber,
            receiverWalletNumber: receiverWallet.walletNumber,
            narration: `Transfer ${amountNum} from ${senderWallet.walletNumber} to ${receiverWallet.walletNumber}`
          },
          { transaction: t }
        );

        // Create ledger entries (double entry)
        await LedgerEntry.bulkCreate(
          [
            {
              transaction_reference: reference,
              wallet_number: senderWallet.walletNumber,
              entry_type: "DEBIT",
              amount: amountNum
            },
            {
              transaction_reference: reference,
              wallet_number: receiverWallet.walletNumber,
              entry_type: "CREDIT",
              amount: amountNum
            }
          ],
          { transaction: t }
        );

        // Mark transaction success
        await tx.update({ status: Status.SUCCESSFUL }, { transaction: t });

        // commit happens in withTxRetry wrapper
        return;
      },
      3
    );
  } catch (err: any) {
    const statusCode = err?.statusCode ?? 500;
    try {
      // Log rollback for audit
      await TransactionHistory.create({
        reference,
        type: Type.REVERSAL,
        amount: amountNum,
        senderWalletNumber: senderWallet!.walletNumber ?? senderWalletNumber,
        narration: `Reversal for ${reference} - reason: ${err.message}`,
        status: Status.ROLLBACK
      });
    } catch (err: any) {
      console.error("MySQL Error =>", err.message);
      console.error("Full Sequelize Error =>", err);
    }

    return res
      .status(statusCode)
      .json({ message: "Transfer failed", error: err.message });
  }

  return res.status(200).json({
    status: "success",
    message: "Transfer successful",
    data: {
      transaction: {
        amount,
        from_wallet: senderWallet!.walletNumber,
        to_wallet: receiverWallet!.walletNumber,
        status: Status.COMPLETED,
        completed_at: new Date().toISOString().slice(0, 19).replace("T", " ")
      }
    }
  });
};

// Get all wallet transactions

/**
 * Input validation
 * Correlation ID (for idempotency/traceability)
 * Atomic boundary or consistency checks (ledger mismatch risk)
 * Pagination + sorting
 * Separation of service / controller (business logic leakage)
 * Read consistency with ledger balance. Ledger consistency check
 * (balance validation)
 * Proper logging
 */

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v || "20"))
});

export const getWalletTransactions = async (req: Request, res: Response) => {
  const idempotencyKey =
    req.headers["x-idempotency-key"] || crypto.randomUUID();

  try {
    const { walletId } = req.params;
    console.log(walletId);
    const { page, limit } = querySchema.parse(req.query);

    if (!walletId || walletId.trim() === "") {
      return res.status(400).json({ message: "Invalid walletId" });
    }

    const result = await getWalletTransactionsService(walletId, page, limit);

    res.status(200).json({
      idempotencyKey,
      wallet: {
        walletNumber: result.wallet.walletNumber,
        balance: result.wallet.balance
      },
      pagination: { page, limit },
      transactions: result.transactions
    });
  } catch (err: any) {
    console.error(`[${idempotencyKey}] Wallet Txn Error:`, err.message);
    res.status(500).json({ idempotencyKey, message: err.message });
  }
};

/**
 * Retrieve recent transactions for the authenticated customer.
 * Requires the "authenticate" middleware to set req.user from JWT.
 */
// export const getRecentTransactions = async (req: Request, res: Response) => {
//   try {
//     // Ensure authentication middleware set req.customer
//     const customer = req.customer as { id: number; email: string };
//     if (!customer || !customer.id) {
//       return res.status(401).json({ message: "Unauthorized access." });
//     }

//     const limit = parseInt(req.query.limit as string) || 10;

//     // Find user's wallet
//     const wallet = await Wallet.findOne({
//       where: { customerId: customer.id },
//       attributes: ["walletNumber"]
//     });

//     if (!wallet) {
//       return res
//         .status(404)
//         .json({ message: "Wallet not found for this user." });
//     }

//     // Fetch transactions
//     const transactions = await TransactionHistory.findAll({
//       where: { walletNumber: wallet.walletNumber },
//       order: [["created_at", "DESC"]],
//       limit,
//       attributes: [
//         "id",
//         "walletNumber",
//         "amount",
//         "type",
//         "reference",
//         "status",
//         "created_at"
//       ]
//     });

//     return res.status(200).json({
//       message: "Recent transactions retrieved successfully.",
//       walletNumber: wallet.walletNumber,
//       count: transactions.length,
//       data: transactions
//     });
//   } catch (error: any) {
//     console.error("Error fetching recent transactions:", error);
//     return res.status(500).json({
//       message: "An error occurred while fetching recent transactions.",
//       error: error.message
//     });
//   }
// };

export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const { walletNumber } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate
    if (!walletNumber) {
      return res.status(400).json({ message: "Wallet number is required." });
    }

    // Fetch transactions
    const transactions = await TransactionHistory.findAll({
      where: { walletNumber },
      order: [["created_at", "DESC"]],
      limit,
      attributes: [
        "id",
        "walletNumber",
        "amount",
        "type",
        "reference",
        "status",
        "created_at"
      ]
    });

    // Empty result
    if (!transactions.length) {
      return res.status(200).json({
        message: "No recent transactions found.",
        count: 0,
        transactions: []
      });
    }

    // Respond
    return res.status(200).json({
      message: "Recent transactions retrieved.",
      count: transactions.length,
      transactions
    });
  } catch (error: any) {
    console.error("Error fetching recent transactions:", error);
    return res.status(500).json({
      message: "An error occurred while fetching recent transactions.",
      error: error.message
    });
  }
};
