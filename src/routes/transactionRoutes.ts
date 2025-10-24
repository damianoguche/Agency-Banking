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

router.post("/deposit", authenticate, creditWallet);
router.post("/withdrawal", authenticate, debitWallet);
router.post("/transfer", authenticate, transferFunds);
router.get("/:walletId", getWalletTransactions);
router.get(
  "/:walletNumber/recentTransactions",
  authenticate,
  getRecentTransactions
);

// // Protected route
// router.get("/me", authenticate, getRecentTransactions);

export default router;
