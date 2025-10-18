/**
 * This middleware intercepts and stores the first response for a given
 * key, then replays it for duplicates.
 * Extracts an Idempotency-Key header (or body field).
 * Checks whether this key already exists in the idempotency_store table
 * If yes → returns the stored response (no re-debit).
 * If no → proceeds to your controller, stores the response, and caches it
 * for subsequent identical calls.
 * @Usage router.post("/withdraw", enforceIdempotency, debitWallet);
 */
import type { Request, Response, NextFunction } from "express";
import IdempotencyStore from "../models/idempotencyStore.ts";

export async function enforceIdempotency(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.header("Idempotency-Key") || req.body.idempotencyKey;

  // Require a key for idempotent endpoints
  if (!key) {
    return res.status(400).json({
      message:
        "Missing Idempotency-Key. Include it in header or request body for safe retries."
    });
  }

  const method = req.method;
  const path = req.originalUrl;

  // Check if key exists
  const existing = await IdempotencyStore.findByPk(key);
  if (existing) {
    console.log(`Replay detected for key ${key} — returning stored response`);
    return res.status(existing.response_code).json(existing.response_body);
  }

  // Capture response body to persist it
  const originalJson = res.json.bind(res);
  (res as any).json = async (body: any) => {
    try {
      await IdempotencyStore.create({
        key,
        method,
        path,
        response_code: res.statusCode,
        response_body: body
      });
    } catch (err: any) {
      console.error("Failed to save idempotency record:", err.message);
    }

    return originalJson(body);
  };

  next();
}
