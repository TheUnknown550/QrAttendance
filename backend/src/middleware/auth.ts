import type { OrganizationRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { verifyJwt } from "../utils/jwt";

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  try {
    const token = header.replace("Bearer ", "");
    request.auth = verifyJwt(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid token"));
  }
}

export async function requireActiveOrganization(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const organizationId = request.auth?.organizationId;

  if (!request.auth || !organizationId) {
    return next(new ApiError(403, "No active organization selected"));
  }

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: request.auth.userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    return next(new ApiError(403, "You do not have access to this organization"));
  }

  request.auth.role = membership.role;
  next();
}

export function requireOrganizationRole(allowedRoles: OrganizationRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth?.role || !allowedRoles.includes(request.auth.role)) {
      return next(new ApiError(403, "You do not have permission to manage this organization"));
    }

    next();
  };
}
