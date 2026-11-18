import { z } from "zod";

export const growthPhaseSchema = z.enum([
  "Vegetatif",
  "Generatif",
  "Pematangan",
]);
export const farmInputSchema = z
  .object({
    name: z.string().trim().min(1).max(70),
    location: z.string().trim().min(1).max(100),
    areaM2: z.number().int().min(1).max(10_000_000),
    phase: growthPhaseSchema,
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
  })
  .strict()
  .refine((v) => (v.latitude === null) === (v.longitude === null), {
    message: "Isi lintang dan bujur bersama-sama.",
  });
export const zoneInputSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
  })
  .strict();
export const assignmentSchema = z
  .object({
    assignedUserIds: z.array(z.string().uuid()).max(50),
    controlUserIds: z.array(z.string().uuid()).max(50),
  })
  .strict()
  .refine(
    (v) => v.controlUserIds.every((id) => v.assignedUserIds.includes(id)),
    {
      message: "Izin kontrol hanya untuk pekerja yang ditugaskan.",
    },
  );
export const ruleInputSchema = z
  .object({
    enabled: z.boolean(),
    phase: growthPhaseSchema,
    threshold: z.number().min(0).max(100),
    target: z.number().min(1).max(20),
    schedule: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .strict();
export const preferencesSchema = z
  .object({ web: z.boolean(), whatsapp: z.boolean() })
  .strict();
export const userInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    displayName: z.string().trim().min(1).max(80),
    password: z
      .string()
      .min(12)
      .max(72)
      .refine((value) => new TextEncoder().encode(value).length <= 72),
    role: z.enum(["ADMIN", "LANDOWNER", "FIELD_WORKER"]),
  })
  .strict();
export type FarmInput = z.infer<typeof farmInputSchema>;
export type RuleInput = z.infer<typeof ruleInputSchema>;
