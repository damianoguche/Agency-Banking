import bcrypt from "bcryptjs";
import Wallet from "../models/wallet.ts";

const MAX_ATTEMPTS = 3;

export async function verifyPin(walletNumber: string, inputPin: string) {
  const wallet = await Wallet.findOne({ where: { walletNumber } });
  if (!wallet) throw new Error("NOT_FOUND");
  if (!wallet.pinHash) throw new Error("PIN_NOT_SET");
  if (wallet.isLocked) throw new Error("LOCKED");

  const isValid = await bcrypt.compare(inputPin, wallet.pinHash);

  if (!isValid) {
    wallet.pinAttempts += 1;

    if (wallet.pinAttempts >= MAX_ATTEMPTS) {
      wallet.isLocked = true;
      // Optional: send notification or trigger alert
    }

    await wallet.save();
    throw new Error("INVALID");
  }

  // Reset attempts on success
  wallet.pinAttempts = 0;
  await wallet.save();
  return true;
}
