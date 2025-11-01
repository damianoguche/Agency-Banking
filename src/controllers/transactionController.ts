import type { Request, Response } from "express";
import Wallet from "../models/wallet.ts";
import { withdrawal } from "../utils/debit.ts";
import TransactionHistory from "../models/transaction.ts";
import { randomUUID } from "crypto";
import { Status } from "../types/status.ts";
import { Type } from "../types/transaction_types.ts";
import { LedgerEntry } from "../models/ledger.ts";
import { withTxRetry } from "../utils/retry.ts";
import Outbox from "../models/outbox.ts";
import { z } from "zod";
import { getWalletTransactionsService } from "../services/getTransactions.ts";
import { verifyPin } from "../utils/verifyPin.ts";
import { AppError } from "../utils/errors.ts";

// Zod Schema
export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(6)
});

interface TransferRequestBody {
  receiverWalletNumber: string;
  amount: number | string;
  narration?: string;
  pin: string;
}

interface CreditRequestBody {
  walletNumber: string;
  narration: string;
  amount: number;
  pin: string;
  reference: string;
}

interface DebitRequestBody {
  walletNumber: string;
  narration: string;
  amount: number;
  pin: string;
  reference: string;
}

/**
 * @desc Handle wallet deposir (atomic, safe retry)
 * @route POST /api/transactions/deposit
 * @access Private (Authenticated)
 */

export const creditWallet = async (
  req: Request<{}, {}, CreditRequestBody>,
  res: Response
): Promise<Response> => {
  const { amount, narration, pin } = req.body;
  const reference = req.body.reference ?? `CR-${randomUUID()}`;
  const sequelize = Wallet.sequelize!;
  const customer = (req as any).customer;

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(amountNum) || amountNum <= 0)
    return res.status(400).json({ message: "Invalid amount entered." });

  try {
    // Verify PIN *outside* transaction (read-only)
    const walletForPin = await Wallet.findOne({
      where: { customerId: customer.id }
    });

    if (!walletForPin) throw new AppError("Wallet not found", 404);
    await verifyPin(walletForPin.walletNumber, pin);

    // Perform all writes atomically
    await withTxRetry(sequelize, async (t) => {
      const wallet = await Wallet.findOne({
        where: { customerId: customer.id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!wallet) throw new Error("Wallet not found");

      await verifyPin(wallet.walletNumber, pin);

      // Create transaction record first
      const txn = await TransactionHistory.create(
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

      // Now create the ledger entry, using txn.reference
      await LedgerEntry.create(
        {
          transaction_reference: txn.reference,
          wallet_number: wallet.walletNumber,
          entry_type: "CREDIT",
          amount: amountNum
        },
        { transaction: t }
      );

      // Update wallet last
      await wallet.increment("balance", { by: amountNum, transaction: t });

      await Outbox.create(
        {
          aggregate_type: "Transaction",
          aggregate_id: txn.reference,
          event_type: "WalletCredited",
          payload: {
            reference: txn.reference,
            walletNumber: wallet.walletNumber,
            amount: amountNum,
            type: Type.DEPOSIT
          },
          published: false
        },
        { transaction: t }
      );
    });

    return res.status(200).json({ message: "Wallet credited" });
  } catch (err: any) {
    await TransactionHistory.create({
      reference: `${reference}-R`,
      type: Type.REVERSAL,
      amount: amountNum,
      narration: `Reversal for ${reference}: ${err.message}`,
      status: Status.ROLLBACK
    });

    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ message: err.message });
  }
};

/**
 * @desc Handle wallet withdrawl (atomic, safe retry)
 * @route POST /api/transactions/withdraw
 * @access Private (Authenticated)
 */
export const debitWallet = async (
  req: Request<{}, {}, DebitRequestBody>,
  res: Response
): Promise<Response> => {
  const customer = (req as any).customer;
  // Validate authenticated customer
  if (!customer?.id) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  // Validate amount
  const { amount, narration, pin } = req.body;
  if (!amount || !pin) {
    return res.status(400).json({ message: "Amount and pin required" });
  }

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "Invalid amount entered" });
  }

  try {
    const walletForPin = await Wallet.findOne({
      where: { customerId: customer.id }
    });

    if (!walletForPin) throw new AppError("Wallet not found", 404);
    await verifyPin(walletForPin.walletNumber, pin);

    // Perform withdrawal
    const { txn, wallet: updatedWallet } = await withdrawal(
      Type.WITHDRAWAL,
      walletForPin.walletNumber,
      amountNum,
      narration
    );

    return res.status(200).json({
      message: "Wallet debited",
      transaction: txn,
      wallet: updatedWallet
    });
  } catch (err: any) {
    const msg =
      err.message === "Wallet not found" ||
      err.message === "Wallet locked due to failed PIN attempts" ||
      err.message === "Insufficient funds" ||
      err.message === "Invalid Transaction PIN"
        ? err.message
        : "Transaction failed";
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ message: msg });
  }
};

/**
 * @desc Handle wallet-to-wallet transfer (atomic, double-entry, safe retry)
 * @route POST /api/transactions/transfer
 * @access Private (Authenticated)
 */
export const transferFunds = async (
  req: Request<{}, {}, TransferRequestBody>,
  res: Response
): Promise<Response> => {
  const { receiverWalletNumber, amount, narration, pin } = req.body || {};

  const customer = (req as any).customer;

  if (!receiverWalletNumber || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "Invalid transfer amount." });
  }

  let senderWallet, receiverWallet;
  const reference = `TX-${randomUUID()}`;
  const sequelize = Wallet.sequelize;

  try {
    await withTxRetry(sequelize, async (t) => {
      senderWallet = await Wallet.findOne({
        where: { customerId: customer.id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      receiverWallet = await Wallet.findOne({
        where: { walletNumber: receiverWalletNumber },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!senderWallet || !receiverWallet) throw new Error("Wallet not found");
      if (senderWallet.id === receiverWallet.id)
        throw new Error("Cannot transfer to self");
      if (senderWallet.balance < amountNum)
        throw new Error("Insufficient funds");

      await verifyPin(senderWallet!.walletNumber, pin);

      // Perform atomic balance updates
      senderWallet.balance -= amountNum;
      await receiverWallet.increment("balance", {
        by: amountNum,
        transaction: t
      });

      // Persist balances AND create transaction + ledger entries inside single atomic tx
      await senderWallet.save({ transaction: t });
      await receiverWallet.save({ transaction: t });

      // Create Master transaction
      const tx = await TransactionHistory.create(
        {
          type: Type.TRANSFER,
          amount: amountNum,
          walletNumber: senderWallet.walletNumber,
          reference,
          senderWalletNumber: senderWallet.walletNumber,
          receiverWalletNumber: receiverWallet.walletNumber,
          narration:
            narration ||
            `Transfer ${amountNum} from ${senderWallet.walletNumber} to ${receiverWallet.walletNumber}`
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
    });
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    try {
      // Log rollback for audit
      await TransactionHistory.create({
        reference,
        type: Type.REVERSAL,
        amount: amountNum,
        senderWalletNumber: senderWallet!.walletNumber,
        narration: `Reversal for ${reference} - reason: ${err.message}`,
        status: Status.ROLLBACK
      });
    } catch (err: any) {
      console.error("MySQL Error =>", err.message);
      console.error("Full Sequelize Error =>", err);
    }

    return res.status(statusCode).json({ message: err.message });
  }

  return res.status(200).json({
    status: "success",
    message: "Transfer successful",
    data: {
      transaction: {
        amount,
        type: Type.TRANSFER,
        senderWalletNumber: senderWallet!.walletNumber,
        receiverWalletNumber: receiverWallet!.walletNumber,
        status: Status.COMPLETED,
        completed_at: new Date().toISOString().slice(0, 19).replace("T", " ")
      }
    }
  });
};

/**
 * @desc Handle Retrieval wallet transactions
 * @route GET /api/transactions/:walletNumber/getTransactions
 * @access Private (Authenticated)
 */
export const getWalletTransactions = async (req: Request, res: Response) => {
  const idempotencyKey =
    req.headers["x-idempotency-key"] || crypto.randomUUID();

  try {
    const { walletNumber } = req.params;
    const { page, limit } = querySchema.parse(req.query);

    if (!walletNumber || walletNumber.trim() === "") {
      return res.status(400).json({ message: "Invalid walletId" });
    }

    const result = await getWalletTransactionsService(
      walletNumber,
      page,
      limit
    );

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
 * @desc Handle Retrieval of Recent Transactions
 * @route GET /api/transactions/:walletNumber/recentTransactions
 * @access Private (Authenticated)
 */
export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const { walletNumber } = req.params;
    if (!walletNumber || walletNumber.trim() === "") {
      return res.status(400).json({ message: "Invalid wallet number" });
    }

    // const limit = parseInt(req.query.limit as string) || 6;
    //const page = parseInt(req.query.page as string) || 1;

    // Parse pagination (Zod provides defaults)
    const { page, limit } = querySchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Fetch paginated transactions
    const { count, rows } = await TransactionHistory.findAndCountAll({
      where: {
        walletNumber
      },
      order: [["created_at", "DESC"]],
      offset,
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
    if (!rows.length) {
      return res.status(200).json({
        message: "No recent transactions found.",
        count: 0,
        page,
        limit,
        transactions: []
      });
    }

    // Success
    return res.status(200).json({
      message: "Recent transactions retrieved.",
      count,
      page,
      limit,
      transactions: rows
    });
  } catch (err: any) {
    console.error("Error fetching recent transactions:", err);
    return res.status(500).json({
      message: "Error fetching recent transactions.",
      error: err.message
    });
  }
};
