import { Router } from "express";
import {
  createCustomer,
  createWallet,
  loginCustomer
} from "../controllers/customerController.ts";

const router = Router();

router.post("/register", createCustomer);
router.post("/login", loginCustomer);
router.post("/logout", loginCustomer);
router.post("/:customerId/wallets", createWallet);

export default router;
