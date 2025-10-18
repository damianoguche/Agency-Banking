import { faker } from "@faker-js/faker";

/**
 * Generate a wallet number with a prefix based on both wallet
 * type and currency.
 * - SAVINGS (NGN) → 300
 * - SAVINGS (USD) → 301
 * - SAVINGS (GBP) → 302
 * - SAVINGS (EUR) → 303
 * - CURRENT (NGN) → 310
 * - CURRENT (USD) → 311
 * - CURRENT (GBP) → 312
 * - CURRENT (EUR) → 313
 * - AGENCY_FLOAT (NGN) → 901
 * - AGENCY_FLOAT (USD) → 902
 * - AGENCY_FLOAT (GBP) → 903
 * - AGENCY_FLOAT (EUR) → 904
 * Defaults to 999 if unknown.
 */
export const createWalletNumber = (
  walletType?: string,
  currency?: string
): string => {
  const prefixMap: Record<string, Record<string, string>> = {
    SAVINGS: { NGN: "300", USD: "301", GBP: "302", EUR: "303" },
    CURRENT: { NGN: "310", USD: "311", GBP: "312", EUR: "313" },
    AGENCY_FLOAT: { NGN: "901", USD: "902", GBP: "903", EUR: "904" }
  };

  // Safely resolve prefix
  const upperType = walletType?.toUpperCase() || "";
  const upperCurr = currency?.toUpperCase() || "";
  const prefix = prefixMap[upperType]?.[upperCurr] || "999";

  // Generate remaining digits (to make total = 10)
  const remainingLength = 10 - prefix.length;
  const randomPart = faker.string.numeric(remainingLength);

  return `${prefix}${randomPart}`;
};
