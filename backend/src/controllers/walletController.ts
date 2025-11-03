import type { Request, Response } from "express";
import Wallet from "../models/wallet.ts";
import bcrypt from "bcryptjs";

// PIN Set
export const setPin = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    const customer = (req as any).customer;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const wallet = await Wallet.findOne({ where: { customerId: customer.id } });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // Prevent overriding an existing PIN
    if (wallet.pinHash) {
      return res
        .status(400)
        .json({ message: "PIN already set. Use Change PIN instead." });
    }

    const salt = await bcrypt.genSalt(10);
    wallet.pinHash = await bcrypt.hash(pin, salt);
    wallet.pinAttempts = 0;
    wallet.isLocked = false;

    await wallet.save();

    return res.status(200).json({ message: "Transaction PIN set" });
  } catch (err) {
    console.error("Error in setPin:", err);
    return res.status(500).json({ message: "Failed to set PIN" });
  }
};

// PIN Change
export const changePin = async (req: Request, res: Response) => {
  try {
    const { oldPin, newPin } = req.body;
    const customer = (req as any).customer;

    if (!oldPin || !newPin) {
      return res
        .status(400)
        .json({ message: "Both old and new PIN are required" });
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      return res.status(400).json({ message: "New PIN must be 4 digits" });
    }

    const wallet = await Wallet.findOne({ where: { customerId: customer.id } });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // Check if wallet has a PIN
    if (!wallet.pinHash) {
      return res
        .status(400)
        .json({ message: "No existing PIN found. Set PIN first." });
    }

    // Verify old PIN
    const isValidOld = await bcrypt.compare(oldPin, wallet.pinHash);
    if (!isValidOld) {
      return res.status(400).json({ message: "Incorrect old PIN" });
    }

    // Hash and update with new PIN
    const salt = await bcrypt.genSalt(10);
    wallet.pinHash = await bcrypt.hash(newPin, salt);
    wallet.pinAttempts = 0;
    wallet.isLocked = false;

    await wallet.save();

    return res.status(200).json({ message: "PIN changed successfully" });
  } catch (err) {
    console.error("Error in changePin:", err);
    return res.status(500).json({ message: "Failed to change PIN" });
  }
};

// PIN Reset
export async function resetPin(req: Request, res: Response) {
  const customer = (req as any).customer;
  const { walletNumber } = req.params;

  const wallet = await Wallet.findOne({
    where: { walletNumber, customerId: customer.id }
  });

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  wallet.pinHash = null;
  wallet.pinAttempts = 0;
  wallet.isLocked = false;

  await wallet.save();

  return res.status(200).json({ message: "PIN reset successful" });
}
