import { OrganizationRole, OrganizationStatus } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { removeStoredAttendeeImage } from "../attendees/attendees.upload";
import { sendOrganizationInactiveWarningEmail } from "../../lib/email";

function subtractDays(days: number, from = new Date()) {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

function addDays(days: number, from: Date) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function purgeOrganization(organizationId: string) {
  const attendees = await prisma.attendee.findMany({
    where: {
      organizationId,
    },
    select: {
      profileImageUrl: true,
    },
  });

  await Promise.all(attendees.map((attendee) => removeStoredAttendeeImage(attendee.profileImageUrl)));

  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({
      where: {
        eventSession: {
          eventSeries: {
            organizationId,
          },
        },
      },
    }),
    prisma.eventSession.deleteMany({
      where: {
        eventSeries: {
          organizationId,
        },
      },
    }),
    prisma.eventSeries.deleteMany({
      where: {
        organizationId,
      },
    }),
    prisma.attendee.deleteMany({
      where: {
        organizationId,
      },
    }),
    prisma.organizationInvite.deleteMany({
      where: {
        organizationId,
      },
    }),
    prisma.organizationMembership.deleteMany({
      where: {
        organizationId,
      },
    }),
    prisma.organization.delete({
      where: {
        id: organizationId,
      },
    }),
  ]);
}

export async function runOrganizationCleanup(now = new Date()) {
  await prisma.organizationInvite.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  const warningThreshold = subtractDays(env.ORGANIZATION_INACTIVE_WARNING_DAYS, now);
  const deleteThreshold = subtractDays(env.ORGANIZATION_HARD_DELETE_DAYS, now);

  const organizationsToMarkInactive = await prisma.organization.findMany({
    where: {
      status: OrganizationStatus.ACTIVE,
      lastActivityAt: {
        lte: warningThreshold,
      },
    },
    select: {
      id: true,
      name: true,
      lastActivityAt: true,
      memberships: {
        where: {
          role: {
            in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
          },
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  for (const organization of organizationsToMarkInactive) {
    const scheduledDeletionAt = addDays(env.ORGANIZATION_HARD_DELETE_DAYS, organization.lastActivityAt);

    await prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        status: OrganizationStatus.INACTIVE,
        inactiveSinceAt: now,
        scheduledDeletionAt,
      },
    });

    const notificationRecipients = Array.from(
      new Set(organization.memberships.map((membership) => membership.user.email)),
    );

    try {
      await sendOrganizationInactiveWarningEmail({
        to: notificationRecipients,
        organizationName: organization.name,
        lastActivityAt: organization.lastActivityAt,
        scheduledDeletionAt,
      });
    } catch (error) {
      console.error("Failed to send organization inactivity warning email", {
        organizationId: organization.id,
        error,
      });
    }
  }

  const purgeCandidates = await prisma.organization.findMany({
    where: {
      OR: [
        {
          lastActivityAt: {
            lte: deleteThreshold,
          },
        },
        {
          scheduledDeletionAt: {
            lte: now,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  for (const organization of purgeCandidates) {
    await purgeOrganization(organization.id);
  }
}
