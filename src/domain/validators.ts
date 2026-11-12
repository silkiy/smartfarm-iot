import { z } from "zod";

const actuatorStatusSchema = z.enum(["ON", "OFF", "OPEN", "CLOSED"]);

export const sensorReadingInputSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(100),
    farmId: z.string().trim().min(1).max(100),
    zoneId: z.string().trim().min(1).max(100),
    soilMoisture: z.number().finite().min(0).max(100),
    waterLevelCm: z.number().finite().min(0).max(1000),
    pumpStatus: actuatorStatusSchema,
    valveStatus: actuatorStatusSchema,
    measuredAt: z.coerce.date(),
    requestId: z.string().trim().min(1).max(200),
  })
  .strict();

export type SensorReadingInput = z.infer<typeof sensorReadingInputSchema>;

export function parseSensorReadingInput(input: unknown): SensorReadingInput {
  return sensorReadingInputSchema.parse(input);
}
