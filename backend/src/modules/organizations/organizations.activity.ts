import { OrganizationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

// Bursts of scans/check-ins against the same organization (e.g. many attendees
// checking in within the same minute) would otherwise each issue an UPDATE
// against this single organization row, serializing on Postgres's row lock.
// Skipping the write when activity was already touched recently turns that
// into a cheap read for the common case instead of a write every request.
const ACTIVITY_TOUCH_THROTTLE_MS = 2 * 60 * 1000;

export async function touchOrganizationActivity(organizationId: string, at = new Date()) {
  const staleBefore = new Date(at.getTime() - ACTIVITY_TOUCH_THROTTLE_MS);

  await prisma.organization.updateMany({
    where: {
      id: organizationId,
      OR: [{ lastActivityAt: { lt: staleBefore } }, { status: { not: OrganizationStatus.ACTIVE } }],
    },
    data: {
      lastActivityAt: at,
      status: OrganizationStatus.ACTIVE,
      inactiveSinceAt: null,
      scheduledDeletionAt: null,
    },
  });
}
