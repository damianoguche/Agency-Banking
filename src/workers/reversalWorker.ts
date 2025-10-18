/**
 * Key points:
 * Reversal is a DB transaction and locks rows.
 * Worker checks for race where credit completes right before
 * reversal — if so, skip reversal.
 * Writes audit trail rows for non-repudiation.
 */

const { Worker } = require("bullmq");
const {
  sequelize,
  Wallet,
  Transaction,
  TransactionHistory
} = require("../models");

const reversalWorker = new Worker(
  "reversalQueue",
  async (job) => {
    const { transactionId } = job.data;
    const txn = await Transaction.findByPk(transactionId);

    if (!txn) throw new Error("Transaction not found (reversal)");

    // If already completed, ignore
    if (txn.status === "COMPLETED" || txn.status === "REVERSED") return;

    // Perform reversal atomically
    return await sequelize.transaction(async (t) => {
      const fromWallet = await Wallet.findByPk(txn.from_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      const toWallet = await Wallet.findByPk(txn.to_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!fromWallet) throw new Error("Sender wallet missing for reversal");

      // Before performing reversal, double-check if receiver was credited later (race window).
      const freshTxn = await Transaction.findByPk(transactionId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (freshTxn.status === "COMPLETED") {
        // Another worker succeeded concurrently; nothing to reverse
        return;
      }

      // Credit sender back
      const before = Number(fromWallet.balance);
      fromWallet.balance = (before + Number(txn.amount)).toFixed(2);
      await fromWallet.save({ transaction: t });

      await TransactionHistory.create(
        {
          transaction_id: txn.id,
          wallet_id: fromWallet.id,
          change: txn.amount,
          balance_before: before,
          balance_after: fromWallet.balance,
          note: "Reversal - credit failed"
        },
        { transaction: t }
      );

      // Update transaction status
      txn.status = "REVERSED";
      txn.failure_reason =
        txn.failure_reason || "Credit failed and automatic reversal applied";
      await txn.save({ transaction: t });

      // Optionally emit alert/notify ops
    });
  },
  { connection: { url: process.env.REDIS_URL }, concurrency: 2 }
);
