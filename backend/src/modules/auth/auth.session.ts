import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

const REFRESH_COOKIE_NAME = "eventqr_refresh_token";
const REFRESH_COOKIE_PATH = "/api/auth";

function addDays(days: number, from = new Date()) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    expires: addDays(env.REFRESH_TOKEN_TTL_DAYS),
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  } as const;
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRefreshToken() {
  return randomBytes(48).toString("hex");
}

export function getRefreshCookie(request: Request) {
  return request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
}

export function clearRefreshCookie(response: Response) {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export function setRefreshCookie(response: Response, token: string) {
  response.cookie(REFRESH_COOKIE_NAME, token, getCookieOptions());
}

export async function createRefreshSession(options: {
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  return prisma.refreshSession.create({
    data: {
      userId: options.userId,
      tokenHash: hashRefreshToken(options.token),
      expiresAt: addDays(env.REFRESH_TOKEN_TTL_DAYS),
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
    },
  });
}

export async function revokeRefreshSessionByToken(token: string, at = new Date()) {
  await prisma.refreshSession.updateMany({
    where: {
      tokenHash: hashRefreshToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: at,
    },
  });
}

export async function revokeAllUserRefreshSessions(userId: string, at = new Date()) {
  await prisma.refreshSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: at,
    },
  });
}

export function getSessionMetadata(request: Request) {
  return {
    userAgent: request.get("user-agent") ?? undefined,
    ipAddress: request.ip || undefined,
  };
}

export async function deleteExpiredRefreshSessions(now = new Date()) {
  await prisma.refreshSession.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: now,
          },
        },
        {
          revokedAt: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });
}

export { REFRESH_COOKIE_NAME };
