import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().default("file:./data/app.db"),
  DATABASE_PROVIDER: z.enum(["auto", "postgres", "sqlite"]).default("auto"),
  AUTH_SECRET: z.string().min(32).optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  ALLOW_REGISTRATION: z.coerce.boolean().default(true),
  REQUIRE_EMAIL_VERIFY: z.coerce.boolean().default(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  SENTRY_DSN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SEED_ON_BOOT: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
  }
  return parsed.data;
}

export const env = load();

export function getBaseUrl(): string {
  return env.APP_URL.replace(/\/$/, "");
}
