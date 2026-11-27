import { z } from "zod";

/** Minimum password length for new registrations; client checks are UX only. */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MAX_LENGTH = 100;

/**
 * Registration input. Unknown keys (including any client-sent `role`) are
 * stripped by Zod; the server always stores `role: "USER"`. No `role` field
 * exists here on purpose.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1, { error: "Nama wajib diisi" }).max(NAME_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Email tidak valid" })),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { error: `Password minimal ${PASSWORD_MIN_LENGTH} karakter` })
    .max(PASSWORD_MAX_LENGTH),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login credentials. Validated server-side before any database lookup; login
 * failure is always surfaced to the user as a single generic message.
 */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Email tidak valid" })),
  password: z.string().min(1, { error: "Password wajib diisi" }),
});

export type SignInInput = z.infer<typeof signInSchema>;
