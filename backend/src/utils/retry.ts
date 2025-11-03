// /**
//  * A transfer flow that addresses Lock wait timeout and improves safety
//  * for a banking-style double-entry ledger.
//  * Key features:
//  * - Consistent lock ordering to prevent deadlocks (lock lower id first).
//  * - Very short-lived transactions (do only DB reads/writes inside the tx).
//  * - Retry logic for ER_LOCK_WAIT_TIMEOUT and deadlocks with exponential
//  * - backoff.
//  * - Proper creation of a single Transaction (business event) and two
//  * - LedgerEntry records (DEBIT/CREDIT) inside the same DB transaction (atomic).
//  * - Updates to Transaction.status inside the transaction (no post-commit
//  * - updates that can get stuck).
//  * - Clear logging and safe reversal creation if the whole attempt fails.
//  */

// /**
//  * withTxRetry
//  * ------------
//  * Executes a callback within a managed transaction, retrying
//  * automatically on transient MySQL deadlocks (1213) and lock wait
//  * timeouts (1205).
//  *
//  * @param sequelize - Sequelize instance
//  * @param callback - async function that performs transactional operations
//  * @param maxAttempts - number of retries before giving up
//  * @param isolationLevel - transaction isolation level (optional)
//  */

// import { Transaction } from "sequelize";

// export async function withTxRetry<T>(
//   sequelize: any,
//   fn: (t: any) => Promise<T>,
//   retries = 3,
//   initialDelayMs = 100
// ): Promise<T> {
//   let attempt = 0;
//   let delay = initialDelayMs;

//   while (true) {
//     attempt++;
//     // withTxRetry() opens a Sequelize transaction internally
//     const t = await sequelize.transaction({
//       isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
//     });

//     try {
//       // passes t into the callback function you provide (fn(t)).
//       const res = await fn(t);
//       await t.commit();

//       return res;
//     } catch (err: any) {
//       await t.rollback();
//       // MySQL deadlock or lock wait timeout codes
//       const code = err?.parent?.code ?? err?.original?.code;
//       if (
//         (code === "ER_LOCK_WAIT_TIMEOUT" || code === "ER_LOCK_DEADLOCK") &&
//         attempt < retries
//       ) {
//         console.warn(
//           `DB lock error (${code}). Retry #${attempt} after ${delay}ms`
//         );
//         await new Promise((r) => setTimeout(r, delay));
//         delay *= 2;
//         continue;
//       }
//       throw err;
//     }
//   }
// }

//import { Transaction } from "sequelize";

/**
 * Fast, Safe Transaction Wrapper
 * ------------------------------
 * - Opens transaction lazily and only retries on transient lock errors.
 * - Uses constant low-delay retry with jitter to avoid thundering herds.
 * - Keeps commits ultra short by measuring execution time.
 * - Logs slow transactions (>200 ms) for performance tuning.
 *
 * @param sequelize Sequelize instance
 * @param fn async (t) => Promise<T>
 * @param options optional tuning parameters
 */
// export async function withTxRetry<T>(
//   sequelize: any,
//   fn: (t: any) => Promise<T>,
//   options: {
//     retries?: number;
//     delayMs?: number;
//     jitter?: number;
//     isolationLevel?: string;
//     logSlowThresholdMs?: number;
//     noRetry?: boolean;
//   } = {}
// ): Promise<T> {
//   const {
//     retries = 3,
//     delayMs = 60,
//     jitter = 40,
//     isolationLevel = Transaction.ISOLATION_LEVELS.READ_COMMITTED,
//     logSlowThresholdMs = 200,
//     noRetry = false
//   } = options;

//   let attempt = 0;

//   while (true) {
//     attempt++;
//     const t = await sequelize.transaction({ isolationLevel });
//     const start = performance.now();

//     try {
//       const result = await fn(t);
//       await t.commit();

//       const duration = performance.now() - start;
//       if (duration > logSlowThresholdMs) {
//         console.warn(
//           `[withTxRetry] Slow txn (${duration.toFixed(
//             1
//           )} ms) on attempt ${attempt}`
//         );
//       }
//       return result;
//     } catch (err: any) {
//       await t.rollback();

//       // Detect transient lock errors
//       const code = err?.parent?.code ?? err?.original?.code;
//       const isTransient =
//         code === "ER_LOCK_WAIT_TIMEOUT" || code === "ER_LOCK_DEADLOCK";

//       if (!isTransient || noRetry || attempt >= retries) {
//         throw err; // Permanent failure
//       }

//       // Fast backoff with random jitter
//       const sleep = delayMs + Math.floor(Math.random() * jitter - jitter / 2);
//       console.warn(
//         `[withTxRetry] Transient ${code} on attempt ${attempt}, retrying in ${sleep} ms`
//       );
//       await new Promise((r) => setTimeout(r, sleep));
//     }
//   }
// }

import { Transaction } from "sequelize";

/**
 * withTxRetry (optimized)
 * ------------------------
 * A lightweight retry wrapper for short-lived, atomic transactions.
 * - Minimal transaction overhead
 * - Exponential backoff only on transient deadlocks or lock timeouts
 * - Detects and logs slow transactions
 * - Auto-disposes transaction objects to avoid lingering locks
 */

export async function withTxRetry<T>(
  sequelize: any,
  fn: (t: any) => Promise<T>,
  retries = 3,
  initialDelayMs = 50,
  isolationLevel = Transaction.ISOLATION_LEVELS.READ_COMMITTED
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    attempt++;
    const t = await sequelize.transaction({ isolationLevel });

    const start = Date.now();

    try {
      const result = await fn(t);

      await t.commit();

      const duration = Date.now() - start;
      if (duration > 300)
        console.warn(
          `[withTxRetry] Slow txn (${duration.toFixed(
            1
          )} ms) on attempt ${attempt}`
        );

      return result;
    } catch (err: any) {
      await t.rollback();

      const duration = Date.now() - start;

      // Transient MySQL lock or deadlock
      const code = err?.parent?.code ?? err?.original?.code;
      const transient =
        code === "ER_LOCK_DEADLOCK" || code === "ER_LOCK_WAIT_TIMEOUT";

      if (transient && attempt < retries) {
        console.warn(
          `[withTxRetry] Transient ${code} on attempt ${attempt} after ${duration}ms, retrying in ${delay}ms`
        );
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.5; // gentle exponential backoff
        continue;
      }

      // Permanent error — or all retries used
      console.error(
        `[withTxRetry] Failed after ${attempt} attempts (${duration}ms):`,
        err.message
      );
      throw err;
    } finally {
      // Ensure transaction cleanup in all cases
      if (!t.finished) await t.rollback().catch(() => {});
    }
  }
}
