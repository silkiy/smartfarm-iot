import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { DeviceDocument } from "@/domain/models";
import { getCollection } from "@/server/db/collections";
import type { Db } from "mongodb";

/** Buat API key baru: kembalikan plaintext (untuk ESP32) dan hash (untuk DB) */
export function generateDeviceKey(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString("hex");
  const hash = hashDeviceKey(plaintext);
  return { plaintext, hash };
}

export function hashDeviceKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export interface AuthenticatedDevice {
  deviceId: string;
  farmId: string;
  zoneId: string;
}

/**
 * Verifikasi X-Device-Key header.
 * Kembalikan info device kalau valid, null kalau tidak.
 */
export async function authenticateDevice(
  request: Request,
  db: Db,
): Promise<AuthenticatedDevice | null> {
  const key = request.headers.get("X-Device-Key");
  if (!key || key.length < 10) return null;

  const hash = hashDeviceKey(key);
  const device = await getCollection<DeviceDocument>(db, "devices").findOne({
    credentialHash: hash,
    status: { $ne: "DISABLED" },
  });
  if (!device) return null;

  return {
    deviceId: device.deviceId,
    farmId: device.farmId.toHexString(),
    zoneId: device.zoneId.toHexString(),
  };
}
