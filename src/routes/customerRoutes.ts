import { Router } from "express";
import {
  createCustomer,
  createWallet
} from "../controllers/customerController.ts";

const router = Router();

router.post("/", createCustomer);
router.post("/:customerId/wallets", createWallet);

export default router;
