import type { Request, Response } from "express";
import { withdrawal } from "../util/debit.ts";
import Wallet from "../models/wallet.ts";
import { Type } from "../types/transaction_types.ts";

export async function payBill(req: Request, res: Response) {
  try {
    const { billType, account, amount } = req.body;
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

    if (!billType || !account || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount < 100) {
      return res.status(400).json({ message: "Minimum bill payment is ₦100" });
    }

    const { wallet: updatedWallet, txn } = await withdrawal(
      Type.BILL_PAYMENT,
      wallet.walletNumber,
      amount,
      "Bill payment initiated"
    );

    return res.status(200).json({
      message: `${billType} bill payment successful`,
      updatedWallet,
      txn
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
