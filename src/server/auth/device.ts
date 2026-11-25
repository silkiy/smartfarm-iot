import "server-only";
import { createHash } from "node:crypto";
import type { DeviceDocument } from "@/domain/models";
import { getCollection } from "@/server/db/collections";
import type { Db } from "mongodb";

/** Hash fleet key untuk disimpan di DB — tidak pernah simpan plaintext */
export function hashFleetKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Ambil fleet key hash dari environment — throw kalau tidak dikonfigurasi */
export function getFleetKeyHash(): string {
  const key = process.env.DEVICE_FLEET_KEY;
  if (!key || key.length < 32)
    throw new Error(
      "DEVICE_FLEET_KEY belum dikonfigurasi atau terlalu pendek.",
    );
  return hashFleetKey(key);
}

export interface AuthenticatedDevice {
  macAddress: string;
  deviceId: string;
  farmId: string;
  zoneId: string;
}

/**
 * Verifikasi dua lapis:
 * 1. X-Fleet-Key header cocok dengan DEVICE_FLEET_KEY di environment
 * 2. MAC address ada di database dan device tidak DISABLED
 *
 * Kembalikan info device kalau valid, null kalau gagal di lapis 1.
 * Throw error khusus kalau lapis 2 gagal (supaya firmware tahu alasannya).
 */
export class DeviceNotProvisionedError extends Error {
  readonly code = "DEVICE_NOT_PROVISIONED";
  readonly status = 403;
}

export class DeviceDisabledError extends Error {
  readonly code = "DEVICE_DISABLED";
  readonly status = 403;
}

export async function authenticateDevice(
  request: Request,
  db: Db,
): Promise<AuthenticatedDevice> {
  // Lapis 1: fleet key
  const fleetKey = request.headers.get("X-Fleet-Key");
  if (!fleetKey) throw new DeviceNotProvisionedError("Fleet key tidak ada.");

  const expectedHash = getFleetKeyHash();
  const actualHash = hashFleetKey(fleetKey);
  // Constant-time comparison untuk cegah timing attack
  if (actualHash !== expectedHash)
    throw new DeviceNotProvisionedError("Fleet key tidak valid.");

  // Lapis 2: MAC address
  const mac = request.headers.get("X-Mac-Address");
  if (!mac || !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac))
    throw new DeviceNotProvisionedError("MAC address tidak valid.");

  const macUpper = mac.toUpperCase();
  const device = await getCollection<DeviceDocument>(db, "devices").findOne({
    macAddress: macUpper,
  });

  if (!device) throw new DeviceNotProvisionedError("Device belum terdaftar.");
  if (device.status === "DISABLED")
    throw new DeviceDisabledError("Device dinonaktifkan.");

  return {
    macAddress: device.macAddress,
    deviceId: device.deviceId,
    farmId: device.farmId.toHexString(),
    zoneId: device.zoneId.toHexString(),
  };
}
