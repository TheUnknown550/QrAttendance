import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyPrefix: string;
  getKey?: (request: Request) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();

  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000).unref();

export function createRateLimit(options: RateLimitOptions) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const key = `${options.keyPrefix}:${options.getKey?.(request) ?? request.ip}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (current.count >= options.maxRequests) {
      return next(new ApiError(429, options.message));
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}
