import { z } from "zod";

/** Format MAC address yang valid: XX:XX:XX:XX:XX:XX (hex, huruf besar atau kecil) */
export const macAddressSchema = z
  .string()
  .regex(
    /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
    "MAC address harus berformat AA:BB:CC:DD:EE:FF",
  )
  .transform((v) => v.toUpperCase());

/** Payload provisioning — ESP32 kirim MAC, server balas config device */
export const provisionRequestSchema = z
  .object({
    macAddress: macAddressSchema,
  })
  .strict();

export type ProvisionRequest = z.infer<typeof provisionRequestSchema>;

/** Respons provisioning yang diterima ESP32 */
export type ProvisionResponse = {
  deviceId: string;
  farmId: string;
  zoneId: string;
};

/** Payload ingest sensor dari ESP32 */
export const ingestSchema = z
  .object({
    macAddress: macAddressSchema,
    soilMoisture: z.number().min(0).max(100),
    waterLevelCm: z.number().min(0).max(100),
    pumpStatus: z.enum(["ON", "OFF"]),
    valveStatus: z.enum(["OPEN", "CLOSED"]),
    /** UUID v4 — idempotency key, dibuat ESP32 per pengiriman */
    requestId: z.string().uuid(),
  })
  .strict();

export type IngestPayload = z.infer<typeof ingestSchema>;

/** Schema registrasi device baru dari dashboard (admin/pemilik) */
export const deviceRegistrationSchema = z
  .object({
    macAddress: macAddressSchema,
    deviceId: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(80),
    farmId: z.string().length(24),
    zoneId: z.string().length(24),
  })
  .strict();

export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>;
