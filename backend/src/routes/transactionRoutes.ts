import { Router } from "express";
import {
  creditWallet,
  transferFunds,
  getWalletTransactions,
  debitWallet,
  getRecentTransactions
} from "../controllers/transactionController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";
import { rechargeAirtime } from "../controllers/airtimeController.ts";
import { payBill } from "../controllers/billController.ts";

const router = Router();

router.post("/deposit", authenticate, creditWallet);
router.post("/withdraw", authenticate, debitWallet);
router.post("/transfer", authenticate, transferFunds);
router.get("/:walletId", getWalletTransactions);
router.get(
  "/:walletNumber/recentTransactions",
  authenticate,
  getRecentTransactions
);

router.post("/airtime/recharge", authenticate, rechargeAirtime);
router.post("/bills/pay", authenticate, payBill);

export default router;
