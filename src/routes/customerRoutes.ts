import { Router } from "express";
import {
  createCustomer,
  createWallet,
  getMe,
  getWalletBalance,
  loginCustomer,
  logoutCustomer
} from "../controllers/customerController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";

const router = Router();

router.post("/register", createCustomer);
router.post("/login", loginCustomer);
router.post("/logout", logoutCustomer);
router.post("/:customerId/wallets", createWallet);
router.get("/:walletNumber/balance", authenticate, getWalletBalance);

/**
 * /me is called when your frontend needs to reconfirm or retrieve the
 * logged-in user's details — typically on initial load, page refresh,
 * or protected route access.
 */

router.get("/me", authenticate, getMe);

export default router;
