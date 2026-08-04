import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { successResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshAuthSchema,
  registerSchema,
  resetPasswordSchema,
  switchOrganizationSchema,
  updateAccountSchema,
} from "./auth.schemas";
import { buildAuthPayload, requireMembership } from "./auth.utils";
import { touchOrganizationActivity } from "../organizations/organizations.activity";
import { env } from "../../config/env";
import { sendPasswordChangedSuccessEmail, sendPasswordResetEmail } from "../../lib/email";
import {
  clearRefreshCookie,
  createRefreshSession,
  createRefreshToken,
  getRefreshCookie,
  getSessionMetadata,
  hashRefreshToken,
  revokeAllUserRefreshSessions,
  revokeRefreshSessionByToken,
  setRefreshCookie,
} from "./auth.session";

async function startUserSession(options: {
  userId: string;
  activeOrganizationId?: string | null;
  request: Request;
  response: Response;
}) {
  const refreshToken = createRefreshToken();

  await createRefreshSession({
    userId: options.userId,
    token: refreshToken,
    ...getSessionMetadata(options.request),
  });

  setRefreshCookie(options.response, refreshToken);

  return buildAuthPayload(options.userId, options.activeOrganizationId);
}

export const login = asyncHandler(async (request, response) => {
  const credentials = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: {
      email: credentials.email,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const payload = await startUserSession({
    userId: user.id,
    request,
    response,
  });

  if (payload.activeOrganizationId) {
    await touchOrganizationActivity(payload.activeOrganizationId);
  }

  response.json(successResponse(payload));
});

export const register = asyncHandler(async (request, response) => {
  const body = registerSchema.parse(request.body);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email is already in use");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
    },
  });

  response
    .status(201)
    .json(successResponse(null, "Account created"));
});

export const refreshAuth = asyncHandler(async (request, response) => {
  const body = refreshAuthSchema.parse(request.body ?? {});
  const refreshToken = getRefreshCookie(request);

  if (!refreshToken) {
    clearRefreshCookie(response);
    throw new ApiError(401, "Refresh session missing");
  }

  const existingSession = await prisma.refreshSession.findUnique({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
    },
  });

  if (!existingSession || existingSession.revokedAt || existingSession.expiresAt <= new Date()) {
    await revokeRefreshSessionByToken(refreshToken);
    clearRefreshCookie(response);
    throw new ApiError(401, "Refresh session expired");
  }

  const nextRefreshToken = createRefreshToken();
  const now = new Date();
  const sessionMetadata = getSessionMetadata(request);

  await prisma.$transaction([
    prisma.refreshSession.update({
      where: {
        id: existingSession.id,
      },
      data: {
        revokedAt: now,
        lastUsedAt: now,
      },
    }),
    prisma.refreshSession.create({
      data: {
        userId: existingSession.userId,
        tokenHash: hashRefreshToken(nextRefreshToken),
        expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
        lastUsedAt: now,
        userAgent: sessionMetadata.userAgent,
        ipAddress: sessionMetadata.ipAddress,
      },
    }),
  ]);

  setRefreshCookie(response, nextRefreshToken);

  response.json(
    successResponse(
      await buildAuthPayload(
        existingSession.userId,
        body.activeOrganizationId === undefined ? undefined : body.activeOrganizationId,
      ),
      "Session refreshed",
    ),
  );
});

export const logout = asyncHandler(async (request, response) => {
  const refreshToken = getRefreshCookie(request);

  if (refreshToken) {
    await revokeRefreshSessionByToken(refreshToken);
  }

  clearRefreshCookie(response);
  response.json(successResponse(null, "Logged out"));
});

export const getMe = asyncHandler(async (request, response) => {
  if (request.auth!.organizationId) {
    await touchOrganizationActivity(request.auth!.organizationId);
  }

  response.json(successResponse(await buildAuthPayload(request.auth!.userId, request.auth!.organizationId)));
});

export const switchOrganization = asyncHandler(async (request, response) => {
  const body = switchOrganizationSchema.parse(request.body);
  await requireMembership(request.auth!.userId, body.organizationId);
  await touchOrganizationActivity(body.organizationId);

  response.json(
    successResponse(
      await buildAuthPayload(request.auth!.userId, body.organizationId),
      "Active organization updated",
    ),
  );
});

export const updateAccount = asyncHandler(async (request, response) => {
  const body = updateAccountSchema.parse(request.body);

  await prisma.user.update({
    where: {
      id: request.auth!.userId,
    },
    data: {
      name: body.name,
    },
  });

  response.json(
    successResponse(
      await buildAuthPayload(request.auth!.userId, request.auth!.organizationId),
      "Account updated",
    ),
  );
});

export const changePassword = asyncHandler(async (request, response) => {
  const body = changePasswordSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: {
      id: request.auth!.userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordValid = await bcrypt.compare(body.currentPassword, user.passwordHash);

  if (!passwordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const newPasswordHash = await bcrypt.hash(body.newPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  await sendPasswordChangedSuccessEmail({
    to: user.email,
    changedAt: new Date(),
  });

  await revokeAllUserRefreshSessions(user.id);

  response.json(successResponse(null, "Password updated"));
});

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const forgotPassword = asyncHandler(async (request, response) => {
  const body = forgotPasswordSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    response.json(successResponse(null, "If that email exists, a reset link has been sent"));
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = new URL(`/reset-password?token=${rawToken}`, env.APP_URL).toString();

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    expiresInMinutes: env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
  });

  response.json(successResponse(null, "If that email exists, a reset link has been sent"));
});

export const resetPassword = asyncHandler(async (request, response) => {
  const body = resetPasswordSchema.parse(request.body);
  const tokenHash = hashResetToken(body.token);

  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (
    !passwordResetToken ||
    passwordResetToken.usedAt ||
    passwordResetToken.expiresAt < new Date()
  ) {
    throw new ApiError(400, "Reset link is invalid or expired");
  }

  const newPasswordHash = await bcrypt.hash(body.newPassword, 10);

  const user = await prisma.user.findUnique({
    where: {
      id: passwordResetToken.userId,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: passwordResetToken.userId,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: passwordResetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.refreshSession.updateMany({
      where: {
        userId: passwordResetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);

  await sendPasswordChangedSuccessEmail({
    to: user.email,
    changedAt: new Date(),
  });

  response.json(successResponse(null, "Password reset successful"));
});
