import { z } from "zod";
import { minimumPasswordLength, maximumPasswordBytes } from "./password-policy";

export const passwordSchema = z
  .string()
  .min(minimumPasswordLength)
  .max(maximumPasswordBytes)
  .refine(
    (value) => new TextEncoder().encode(value).length <= maximumPasswordBytes,
  );

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: passwordSchema,
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
