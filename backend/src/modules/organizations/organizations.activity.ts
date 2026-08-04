import { OrganizationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export async function touchOrganizationActivity(organizationId: string, at = new Date()) {
  await prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      lastActivityAt: at,
      status: OrganizationStatus.ACTIVE,
      inactiveSinceAt: null,
      scheduledDeletionAt: null,
    },
  });
}
