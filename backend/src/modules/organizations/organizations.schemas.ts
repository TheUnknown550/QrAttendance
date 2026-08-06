import { z } from "zod";

const organizationRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2),
});

export const joinOrganizationSchema = z.object({
  joinCode: z.string().trim().min(4),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).optional(),
  requireAttendeeEmail: z.boolean().optional(),
  requireAttendeePhone: z.boolean().optional(),
  requireAttendeeNumber: z.boolean().optional(),
});

export const createInviteSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const updateMembershipRoleSchema = z.object({
  role: organizationRoleSchema,
});
