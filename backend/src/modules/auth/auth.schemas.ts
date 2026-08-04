import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(6),
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(6),
});

export const refreshAuthSchema = z.object({
  activeOrganizationId: z.string().uuid().nullable().optional(),
});
