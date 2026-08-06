import { z } from "zod";

export const createAttendeeTypeSchema = z.object({
  label: z.string().trim().min(1).max(80),
});
