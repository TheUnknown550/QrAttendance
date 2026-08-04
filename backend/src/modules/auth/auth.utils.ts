import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { signJwt } from "../../utils/jwt";

export async function buildAuthPayload(userId: string, activeOrganizationId?: string | null) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      memberships: {
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const resolvedActiveOrganizationId =
    activeOrganizationId === undefined
      ? (user.memberships[0]?.organizationId ?? null)
      : activeOrganizationId;

  const activeMembership =
    resolvedActiveOrganizationId === null
      ? null
      : user.memberships.find((membership) => membership.organizationId === resolvedActiveOrganizationId) ?? null;

  const token = signJwt({
    userId: user.id,
    organizationId: activeMembership?.organizationId ?? null,
    role: activeMembership?.role ?? null,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    memberships: user.memberships.map((membership) => ({
      membershipId: membership.id,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      joinCode: membership.organization.joinCode,
      role: membership.role,
    })),
    activeOrganizationId: activeMembership?.organizationId ?? null,
  };
}

export async function requireMembership(userId: string, organizationId: string) {
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "You do not have access to this organization");
  }

  return membership;
}
