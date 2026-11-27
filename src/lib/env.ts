import { z } from "zod";

/** Auth.js and cron secrets must be long enough to resist offline guessing. */
const MIN_SECRET_LENGTH = 32;

/**
 * Environment contract for the whole app. Validated once, on first use, so a
 * misconfigured deployment fails fast instead of at the first database call.
 * Error messages never include the offending values (they may be secrets).
 */
const envSchema = z.object({
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required" })
    .min(1, { error: "MONGODB_URI is required" })
    .refine((value) => /^mongodb(\+srv)?:\/\//.test(value), {
      error: "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    }),
  MONGODB_DB_NAME: z
    .string({ error: "MONGODB_DB_NAME is required" })
    .regex(/^[A-Za-z0-9_-]+$/, {
      error:
        "MONGODB_DB_NAME is required and may only contain letters, digits, hyphens and underscores",
    }),
  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is required" })
    .min(MIN_SECRET_LENGTH, {
      error: `AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
    }),
  AUTH_URL: z.url({ error: "AUTH_URL must be a valid URL" }).default(
    "http://localhost:3000",
  ),
  ADMIN_EMAIL: z.email({ error: "ADMIN_EMAIL must be a valid email" }).optional(),
  CRON_SECRET: z
    .string()
    .min(MIN_SECRET_LENGTH, {
      error: `CRON_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
    })
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment variables:\n${details}\nCompare your .env with .env.example.`,
    );
  }

  return result.data;
}

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
