import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
