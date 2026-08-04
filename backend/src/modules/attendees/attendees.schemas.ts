import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

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
  name: z.string().trim().min(1),
  email: z.email(),
  phone: optionalString,
  attendeeNumber: optionalAttendeeNumber,
});

export const updateAttendeeSchema = createAttendeeSchema.partial().extend({
  removeProfileImage: z.boolean().optional(),
});
