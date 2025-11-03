import type { Request, Response } from "express";
import { withdrawal } from "../utils/debit.ts";
import Wallet from "../models/wallet.ts";
import { Type } from "../types/transaction_types.ts";

export async function rechargeAirtime(req: Request, res: Response) {
  try {
    const { phone, network, amount } = req.body;
    const customer = (req as any).customer;

    // Validate authenticated customer
    if (!customer?.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Fetch wallet
    const wallet = await Wallet.findOne({ where: { customerId: customer.id } });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (!phone || !network || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount < 50) {
      return res.status(400).json({ message: "Minimum recharge is ₦50" });
    }

    // Debit wallet
    const { wallet: updatedWallet, txn } = await withdrawal(
      Type.AIRTIME_PURCHASE,
      wallet.walletNumber,
      amount,
      "Airtime purchase"
    );

    return res.status(200).json({
      message: "Airtime recharge successful",
      updatedWallet,
      txn
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
