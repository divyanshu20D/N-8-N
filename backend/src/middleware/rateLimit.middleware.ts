import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/errorResponse";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

type RateLimitOptionsSource = RateLimitOptions | (() => RateLimitOptions);

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const getClientIp = (req: Request) => {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || req.ip;
  }
  return req.ip;
};

export const createRateLimiter = (optionsSource: RateLimitOptionsSource) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const options =
      typeof optionsSource === "function" ? optionsSource() : optionsSource;
    const now = Date.now();
    const key = `${options.keyPrefix}:${getClientIp(req)}`;
    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      sendError(res, 429, {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
        details: {
          retryAfterSeconds,
          windowMs: options.windowMs,
          maxRequests: options.maxRequests,
        },
      });
      return;
    }

    existing.count += 1;
    rateLimitStore.set(key, existing);
    next();
  };
};
