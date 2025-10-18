const express = require("express");
const router = express.Router();
const { initiateTransfer } = require("../services/transferService");

router.post("/transfer", async (req, res) => {
  try {
    const idempotencyKey =
      req.headers["idempotency-key"] || req.body.idempotencyKey;
    const { fromWalletNumber, toWalletNumber, amount } = req.body;

    const txn = await initiateTransfer({
      idempotencyKey,
      fromWalletNumber,
      toWalletNumber,
      amount
    });
    return res.status(202).json({ transactionId: txn.id, status: txn.status });
  } catch (err) {
    console.error("Transfer error", err);
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
