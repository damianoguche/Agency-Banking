/**
 * walletType prefix logic
 * Collision-safe wallet number generation
 * Generate a wallet with a prefix based on wallet type.
 * - SAVINGS → 300
 * - CURRENT → 310
 * Defaults to 999 if type is not recognized.
 */

import { faker } from "@faker-js/faker";
import Wallet from "../models/wallet.ts";

export const createWalletNumber = async (
  walletType?: string
): Promise<string> => {
  // Prefix mapping by wallet type
  const prefixMap: Record<string, string> = {
    SAVINGS: "300",
    CURRENT: "310"
  };

  // Choose prefix based on type (fallback = 999)
  const prefix = prefixMap[walletType?.toUpperCase() || ""] || "999";

  // Ensure the total length = 10 digits
  const remainingLength = 10 - prefix.length;

  // Retry until a unique number is found
  let unique = false;
  let walletNumber = "";

  while (!unique) {
    const randomPart = faker.string.numeric(remainingLength);
    walletNumber = `${prefix}${randomPart}`;

    const exists = await Wallet.findOne({ where: { walletNumber } });
    if (!exists) unique = true;
  }

  return walletNumber;
};
