import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .or(z.literal("").transform(() => undefined))
  .refine((value) => value === undefined || z.email().safeParse(value).success, {
    message: "Invalid email address",
  });

const optionalAttendeeNumber = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((value) => {
    // undefined => field omitted, leave unchanged. null/"" => explicit clear.
    if (value === undefined) {
      return undefined;
    }

    if (value === null || (typeof value === "string" && value.trim() === "")) {
      return null;
    }

    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  });

export const createAttendeeSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  organizationName: optionalString,
  attendeeType: optionalString,
  email: optionalEmail,
  phone: optionalString,
  attendeeNumber: optionalAttendeeNumber,
});

export const updateAttendeeSchema = createAttendeeSchema.partial().extend({
  removeProfileImage: z.boolean().optional(),
});

export const sendQrEmailsSchema = z.object({
  eventName: z.string().trim().min(1),
  subject: optionalString,
  eventDate: optionalString,
  eventLocation: optionalString,
  message: optionalString,
  attendeeIds: z.array(z.string().uuid()).optional(),
  recipientFilter: z.enum(["all", "new"]).optional(),
});

const columnIndexSchema = z.number().int().min(0);

export const importColumnMappingSchema = z.object({
  fullName: columnIndexSchema.optional(),
  firstName: columnIndexSchema.optional(),
  surname: columnIndexSchema.optional(),
  organizationName: columnIndexSchema.optional(),
  attendeeType: columnIndexSchema.optional(),
  email: columnIndexSchema.optional(),
  phone: columnIndexSchema.optional(),
  attendeeNumber: columnIndexSchema.optional(),
});

export const confirmAttendeeImportSchema = z.object({
  rows: z.array(z.array(z.string())).min(1),
  mapping: importColumnMappingSchema,
});
