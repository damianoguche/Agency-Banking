/**
 * Aproduction-grade hybrid (Redis + DB) version for banking APIs or
 * any high-volume transaction system.
 *
 * Check Redis first (ultra-fast replay)
 * Fallback to DB (durable storage)
 * Auto-sync Redis when DB is hit
 * Handle race conditions safely (atomic locks)
 * Clean up expired keys automatically
 */
import type { Request, Response, NextFunction } from "express";
import IdempotencyStore from "../models/idempotencyStore.ts";
import redis from "../utils/redisClient.ts";

const IDEMP_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function enforceIdempotency(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.header("Idempotency-Key") || req.body.idempotencyKey;

  if (!key) {
    return res.status(400).json({
      message:
        "Missing Idempotency-Key. Include it in header or body for safe retries."
    });
  }

  const method = req.method;
  const path = req.originalUrl;
  const redisKey = `idem:${key}`;

  // ---Check Redis cache ---
  const cached = await redis.get(redisKey);
  if (cached) {
    const { code, body } = JSON.parse(cached);
    console.log(`Replay via Redis for key ${key}`);
    return res.status(code).json(body);
  }

  // ---Check DB fallback ---
  const existing = await IdempotencyStore.findByPk(key);
  if (existing) {
    console.log(`Replay via DB for key ${key}`);
    // sync Redis for faster next hit
    await redis.set(
      redisKey,
      JSON.stringify({
        code: existing.response_code,
        body: existing.response_body
      }),
      "EX",
      IDEMP_TTL_SECONDS
    );
    return res.status(existing.response_code).json(existing.response_body);
  }

  // ---Lock key to prevent race conditions ---
  const lockKey = `lock:${key}`;
  const lock = await redis.set(lockKey, "locked", { NX: true, EX: 10 });
  if (!lock) {
    // If lock exists, another request is processing the same key
    return res.status(409).json({
      message: "Duplicate request in progress. Try again shortly."
    });
  }

  // ---Capture original res.json for post-processing ---
  const originalJson = res.json.bind(res);
  (res as any).json = async (body: any) => {
    try {
      const record = {
        key,
        method,
        path,
        response_code: res.statusCode,
        response_body: body
      };

      // Store in DB for durability
      await IdempotencyStore.create(record);

      // Cache in Redis for fast replay
      await redis.set(
        redisKey,
        JSON.stringify({
          code: record.response_code,
          body: record.response_body
        }),
        "EX",
        IDEMP_TTL_SECONDS
      );

      // Release lock
      await redis.del(lockKey);
    } catch (err: any) {
      console.error("Idempotency store save error:", err.message);
    }

    return originalJson(body);
  };

  next();
}
