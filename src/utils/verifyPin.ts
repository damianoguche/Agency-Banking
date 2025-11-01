import bcrypt from "bcryptjs";
import Wallet from "../models/wallet.ts";

const MAX_ATTEMPTS = 3;

export async function verifyPin(walletNumber: string, inputPin: string) {
  const wallet = await Wallet.findOne({ where: { walletNumber } });

  if (!wallet) throw new Error("Authentication failed");
  if (!wallet.pinHash) throw new Error("Set transaction PIN first");
  if (wallet.isLocked)
    throw new Error("Wallet locked due to failed PIN attempts");

  const isValid = await bcrypt.compare(inputPin, wallet.pinHash);

  if (!isValid) {
    wallet.pinAttempts += 1;

    if (wallet.pinAttempts >= MAX_ATTEMPTS) {
      wallet.isLocked = true;
      // Optional: send notification or trigger alert
    }

    await wallet.save();
    throw new Error("Invalid Transaction PIN");
  }

  // Reset attempts on success
  wallet.pinAttempts = 0;
  await wallet.save();
  return true;
}

// if (wallet.isLocked) {
//   const lockDuration = Date.now() - wallet.lockedAt;
//   if (lockDuration > 15 * 60 * 1000) { // 15 min
//     wallet.isLocked = false;
//     wallet.pinAttempts = 0;
//     await wallet.save();
//   } else {
//     throw new Error("LOCKED");
//   }
// }
