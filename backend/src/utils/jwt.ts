import type { OrganizationRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = {
  userId: string;
  organizationId: string | null;
  role: OrganizationRole | null;
};

export function signJwt(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
  });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
