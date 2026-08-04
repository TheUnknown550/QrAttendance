import type { NextFunction, Request, Response } from "express";
import { corsOrigins } from "../config/env";
import { ApiError } from "../utils/api-error";

const allowedOrigins = new Set(corsOrigins);

export function requireTrustedOrigin(request: Request, _response: Response, next: NextFunction) {
  const origin = request.get("origin") ?? request.get("referer");

  if (!origin) {
    return next();
  }

  try {
    const normalizedOrigin = new URL(origin).origin;

    if (allowedOrigins.has(normalizedOrigin)) {
      return next();
    }
  } catch {
    // fall through to error
  }

  return next(new ApiError(403, "Request origin is not allowed"));
}
