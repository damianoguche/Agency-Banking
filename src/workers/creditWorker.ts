/*
Credit worker (BullMQ) — attempts credit, marks COMPLETED, otherwise 
leaves for retry.

Key points:
- attempts and exponential backoff let the worker retry transient 
failures.
On final failure, we schedule a delayed reversal job (compensating 
transaction).

Workers are idempotent: they check txn.status and skip if already 
resolved.
*/
const { Worker, Queue } = require("bullmq");
const {
  sequelize,
  Wallet,
  Transaction,
  TransactionHistory
} = require("../models");
const redisConn = { connection: { url: process.env.REDIS_URL } };
const reversalQueue = new Queue("reversalQueue", redisConn);

const CREDIT_RETRY_LIMIT = Number(process.env.CREDIT_RETRY_LIMIT || 5);
const REVERSE_DELAY_SECONDS = Number(process.env.REVERSE_DELAY_SECONDS || 120);

const creditWorker = new Worker(
  "creditQueue",
  async (job) => {
    const { transactionId } = job.data;
    // Fetch latest transaction state
    const txn = await Transaction.findByPk(transactionId);
    if (!txn) throw new Error("Transaction not found");

    if (txn.status !== "PENDING") {
      // idempotency: job may be reprocessed - nothing to do
      return;
    }

    // Attempt to credit inside DB transaction to make the credit atomic
    return await sequelize.transaction(async (t) => {
      // Fetch wallets with lock
      const toWallet = await Wallet.findByPk(txn.to_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      const fromWallet = await Wallet.findByPk(txn.from_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!toWallet || !fromWallet) {
        throw new Error("Wallet not found while crediting");
      }

      // Credit receiver
      const beforeTo = Number(toWallet.balance);
      toWallet.balance = (beforeTo + Number(txn.amount)).toFixed(2);
      await toWallet.save({ transaction: t });
      await TransactionHistory.create(
        {
          transaction_id: txn.id,
          wallet_id: toWallet.id,
          change: txn.amount,
          balance_before: beforeTo,
          balance_after: toWallet.balance,
          note: "Credit - transfer received"
        },
        { transaction: t }
      );

      // Mark transaction COMPLETED
      txn.status = "COMPLETED";
      await txn.save({ transaction: t });
    });
  },
  { connection: { url: process.env.REDIS_URL }, concurrency: 5 }
);

creditWorker.on("failed", async (job, err) => {
  // If job has exceeded attempts, schedule a reversal job after delay
  const attemptsMade = job.attemptsMade || 0;
  if (attemptsMade >= Number(process.env.CREDIT_RETRY_LIMIT || 5)) {
    const transactionId = job.data.transactionId;
    // schedule reversal
    await reversalQueue.add(
      "reversal",
      { transactionId },
      { delay: REVERSE_DELAY_SECONDS * 1000, removeOnComplete: true }
    );
  }
});
