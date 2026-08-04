import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalDate = z
  .string()
  .datetime()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createEventSeriesSchema = z.object({
  name: z.string().trim().min(1),
  description: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
});

export const updateEventSeriesSchema = createEventSeriesSchema;

export const createEventSessionSchema = z.object({
  title: z.string().trim().min(1),
  description: optionalString,
  sessionDate: z.string().datetime(),
});

export const updateEventSessionSchema = createEventSessionSchema;

export const manageSessionAttendanceSchema = z.object({
  attendeeId: z.string().uuid(),
});
