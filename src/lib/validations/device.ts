import { z } from "zod";
import { MAC_ADDRESS_REGEX } from "@/lib/crypto";

/**
 * Create-device input. Unknown keys (including client `ownerId`, `apiKeyHash`,
 * `role`, `mode`, `apiKey`, ...) are stripped; the server always sets
 * `ownerId`, `apiKeyHash`, `mode`, `desiredPumpState`, `createdAt`, and
 * generates the one-time `x-api-key`.
 */
export const createDeviceSchema = z.object({
  name: z.string().trim().min(1, { error: "Nama perangkat wajib diisi" }).max(100),
  deviceId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,64}$/, { error: "ID perangkat hanya huruf/angka/-/_ (1-64)" })
    .optional(),
  macAddress: z.string().trim().regex(MAC_ADDRESS_REGEX, { error: "Format MAC harus AA:BB:CC:DD:EE:FF" }),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
