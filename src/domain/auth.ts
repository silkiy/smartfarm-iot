import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(32, "Username maksimal 32 karakter")
      .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan _"),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password minimal ${MIN_PASSWORD_LENGTH} karakter`)
      .max(72, "Password maksimal 72 karakter"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
