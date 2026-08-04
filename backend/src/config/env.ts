import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFlag = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().min(1),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: booleanFlag.default(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  REPORT_EXPORT_MAX_ROWS: z.coerce.number().int().positive().default(5000),
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(25),
  MAX_PAGE_SIZE: z.coerce.number().int().positive().default(100),
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM_EMAIL: z.string().email(),
  APP_URL: z.string().url(),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  ORGANIZATION_INACTIVE_WARNING_DAYS: z.coerce.number().int().positive().default(75),
  ORGANIZATION_HARD_DELETE_DAYS: z.coerce.number().int().positive().default(90),
  ORGANIZATION_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
});

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN.split(",").map((value) => value.trim());
