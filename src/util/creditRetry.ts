import { Sequelize, Transaction } from "sequelize";

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
export async function withTxRetry<T>(
  sequelize: Sequelize,
  callback: (t: Transaction) => Promise<T>,
  maxAttempts = 3,
  isolationLevel: Transaction.ISOLATION_LEVELS = Transaction.ISOLATION_LEVELS
    .READ_COMMITTED
): Promise<T> {
  let attempt = 0;

  while (true) {
    attempt++;

    const t = await sequelize.transaction({ isolationLevel });

    try {
      const result = await callback(t);

      await t.commit();
      return result;
    } catch (err: any) {
      // Detect transient MySQL errors
      const isDeadlock =
        err?.original?.code === "ER_LOCK_DEADLOCK" ||
        err?.original?.errno === 1213;
      const isLockTimeout =
        err?.original?.code === "ER_LOCK_WAIT_TIMEOUT" ||
        err?.original?.errno === 1205;

      // Always rollback

      try {
        await t.rollback();
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      // Retry logic
      if ((isDeadlock || isLockTimeout) && attempt < maxAttempts) {
        const delay = Math.floor(Math.random() * 200) + 100; // jitter (100–300ms)
        console.warn(
          `[TX-RETRY] Attempt ${attempt} failed (${err?.message}), retrying in ${delay}ms`
        );
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      // Permanent failure — rethrow
      throw err;
    }
  }
}
