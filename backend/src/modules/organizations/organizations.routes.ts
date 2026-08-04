import { Router } from "express";
import { requireActiveOrganization, requireAuth, requireOrganizationRole } from "../../middleware/auth";
import { OrganizationRole } from "@prisma/client";
import {
  acceptInvite,
  createInvite,
  createOrganization,
  deleteCurrentOrganization,
  getCurrentOrganization,
  getInvitePublicInfo,
  getOrganizations,
  joinOrganization,
  leaveCurrentOrganization,
  regenerateJoinCode,
  removeMembership,
  updateMembershipRole,
  updateCurrentOrganization,
} from "./organizations.controller";

const organizationsRouter = Router();
const publicOrganizationsRouter = Router();

publicOrganizationsRouter.get("/invites/:token", getInvitePublicInfo);

organizationsRouter.use(requireAuth);
organizationsRouter.get("/", getOrganizations);
organizationsRouter.post("/", createOrganization);
organizationsRouter.post("/join", joinOrganization);
organizationsRouter.post("/invites/:token/accept", acceptInvite);
organizationsRouter.get("/current", requireActiveOrganization, getCurrentOrganization);
organizationsRouter.patch(
  "/current",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]),
  updateCurrentOrganization,
);
organizationsRouter.delete(
  "/current",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]),
  deleteCurrentOrganization,
);
organizationsRouter.post(
  "/current/regenerate-join-code",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]),
  regenerateJoinCode,
);
organizationsRouter.post(
  "/current/invites",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]),
  createInvite,
);
organizationsRouter.post("/current/leave", requireActiveOrganization, leaveCurrentOrganization);
organizationsRouter.patch(
  "/current/members/:membershipId",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER]),
  updateMembershipRole,
);
organizationsRouter.delete(
  "/current/members/:membershipId",
  requireActiveOrganization,
  requireOrganizationRole([OrganizationRole.OWNER]),
  removeMembership,
);

export { organizationsRouter, publicOrganizationsRouter };
