import { Router } from "express";
import {
  creditWallet,
  transferFunds,
  getWalletTransactions,
  debitWallet,
  getRecentTransactions
} from "../controllers/transactionController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";

const router = Router();

router.post("/credit", creditWallet);
router.post("/debit", debitWallet);
router.post("/transfer", transferFunds);
router.get("/:walletId", getWalletTransactions);
router.get(
  "/:walletNumber/recentTransactions",
  authenticate,
  getRecentTransactions
);

// // Protected route
// router.get("/me", authenticate, getRecentTransactions);

export default router;
