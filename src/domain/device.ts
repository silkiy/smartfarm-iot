import { z } from "zod";

/** Payload yang dikirim ESP32 ke POST /api/devices/ingest */
export const ingestSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(64),
    soilMoisture: z.number().min(0).max(100),
    waterLevelCm: z.number().min(0).max(100),
    pumpStatus: z.enum(["ON", "OFF"]),
    valveStatus: z.enum(["OPEN", "CLOSED"]),
    /** Idempotency key — UUID v4 yang dibuat ESP32 per pengiriman */
    requestId: z.string().uuid(),
  })
  .strict();

export type IngestPayload = z.infer<typeof ingestSchema>;

/** Schema untuk registrasi device baru oleh pemilik/admin */
export const deviceRegistrationSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(80),
    farmId: z.string().length(24),
    zoneId: z.string().length(24),
  })
  .strict();

export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>;
