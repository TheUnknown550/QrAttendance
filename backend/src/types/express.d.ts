import type { OrganizationRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        organizationId: string | null;
        role: OrganizationRole | null;
      };
    }
  }
}

export {};
