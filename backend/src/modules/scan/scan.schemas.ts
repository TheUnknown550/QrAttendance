import { z } from "zod";

export const checkInSchema = z.object({
  qrToken: z.string().min(12),
  eventSessionId: z.string().uuid(),
});

export const publicCheckInSchema = z.object({
  qrToken: z.string().min(12),
});
