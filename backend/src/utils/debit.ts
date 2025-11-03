import { randomUUID } from "crypto";
import Wallet from "../models/wallet.ts";
import TransactionHistory from "../models/transaction.ts";
import { Transaction } from "sequelize";
import { Status } from "../types/status.ts";
import { Type } from "../types/transaction_types.ts";
import { LedgerEntry } from "../models/ledger.ts";
import Outbox from "../models/outbox.ts";
import { AppError } from "./errors.ts";

export async function withdrawal(
  type: Type,
  walletNumber: string,
  amount: number,
  naration?: string,
  idempotencyKey?: string
): Promise<{ wallet: Wallet; txn: TransactionHistory }> {
  const t = await Wallet.sequelize!.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  // Use supplied key or generate a deterministic one
  const reference = idempotencyKey || `DR-${randomUUID()}`;

  try {
    // ---Idempotency Check ---
    const existingTxn = await TransactionHistory.findOne({
      where: { reference },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existingTxn) {
      // rollback to release locks before returning
      await t.rollback();
      const existingWallet = await Wallet.findOne({ where: { walletNumber } });
      if (!existingWallet) throw new AppError("Wallet not found", 400);
      return { wallet: existingWallet, txn: existingTxn };
    }

    const wallet = await Wallet.findOne({
      where: { walletNumber },
      transaction: t,
      lock: t.LOCK.UPDATE // row level lock
    });

    if (!wallet) throw new AppError("Wallet not found", 404);
    if (wallet.balance < amount) throw new AppError("Insufficient funds", 400);

    // ---Perform debit ---
    wallet.balance -= amount;
    await wallet.save({ transaction: t });

    // ---Record transaction ---
    const txn = await TransactionHistory.create(
      {
        type,
        walletNumber,
        amount,
        reference,
        narration: naration || "Wallet debited",
        status: Status.SUCCESSFUL
      },
      { transaction: t }
    );

    // ---Ledger entry ---
    await LedgerEntry.create(
      {
        transaction_reference: reference,
        wallet_number: walletNumber,
        entry_type: "DEBIT",
        amount
      },
      { transaction: t }
    );

    // ---Outbox event ---
    await Outbox.create(
      {
        aggregate_type: "Transaction",
        aggregate_id: reference,
        event_type: type,
        payload: { reference, walletNumber, amount, type },
        published: false
      },
      { transaction: t }
    );

    await t?.commit();

    return { wallet, txn };
  } catch (err) {
    await t?.rollback();
    throw err;
  }
}
