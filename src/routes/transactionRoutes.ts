import { Router } from "express";
import {
  creditWallet,
  transferFunds,
  getWalletTransactions,
  debitWallet
} from "../controllers/transactionController.ts";

const router = Router();

router.post("/credit", creditWallet);
router.post("/debit", debitWallet);
router.post("/transfer", transferFunds);
router.get("/:walletId", getWalletTransactions);

export default router;
