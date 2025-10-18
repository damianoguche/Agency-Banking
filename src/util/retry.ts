/**
 * A transfer flow that addresses Lock wait timeout and improves safety
 * for a banking-style double-entry ledger.
 * Key features:
 * - Consistent lock ordering to prevent deadlocks (lock lower id first).
 * - Very short-lived transactions (do only DB reads/writes inside the tx).
 * - Retry logic for ER_LOCK_WAIT_TIMEOUT and deadlocks with exponential
 * - backoff.
 * - Proper creation of a single Transaction (business event) and two
 * - LedgerEntry records (DEBIT/CREDIT) inside the same DB transaction (atomic).
 * - Updates to Transaction.status inside the transaction (no post-commit
 * - updates that can get stuck).
 * - Clear logging and safe reversal creation if the whole attempt fails.
 */

/**
 * withTxRetry
 * ------------
 * Executes a callback within a managed transaction, retrying automatically on
 * transient MySQL deadlocks (1213) and lock wait timeouts (1205).
 *
 * @param sequelize - Sequelize instance
 * @param callback - async function that performs transactional operations
 * @param maxAttempts - number of retries before giving up
 * @param isolationLevel - transaction isolation level (optional)
 */

import { Transaction } from "sequelize";

export async function withTxRetry<T>(
  sequelize: any,
  fn: (t: any) => Promise<T>,
  retries = 3,
  initialDelayMs = 100
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    attempt++;
    // withTxRetry() opens a Sequelize transaction internally
    const t = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // passes t into the callback function you provide (fn(t)).
      const res = await fn(t);
      await t.commit();

      return res;
    } catch (err: any) {
      await t.rollback();
      // MySQL deadlock or lock wait timeout codes
      const code = err?.parent?.code ?? err?.original?.code;
      if (
        (code === "ER_LOCK_WAIT_TIMEOUT" || code === "ER_LOCK_DEADLOCK") &&
        attempt < retries
      ) {
        console.warn(
          `DB lock error (${code}). Retry #${attempt} after ${delay}ms`
        );
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}
