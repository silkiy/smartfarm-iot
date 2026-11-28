import type { ObjectId } from "mongodb";
import { computeDeviceStatus, type DeviceStatus } from "@/lib/device-status";

export type DeviceMode = "AUTO" | "MANUAL";

/** MongoDB `devices` document. `apiKeyHash` never leaves the server. */
export type DeviceDocument = {
  _id?: ObjectId;
  deviceId: string;
  ownerId: string;
  name?: string;
  macAddress?: string;
  apiKeyHash?: string;
  mode?: DeviceMode;
  desiredPumpState?: boolean;
  createdAt?: Date;
  lastSeenAt?: Date | string | null;
};

/** Safe device view for lists; `apiKeyHash` is never included. */
export type DeviceListItem = {
  id: string;
  deviceId: string;
  name: string | null;
  macAddress: string | null;
  mode: DeviceMode;
  status: DeviceStatus;
  lastSeenAt: string | null;
  createdAt: string | null;
};

/** Map a raw `devices` document to a safe view; `apiKeyHash` dropped. */
export function toDeviceListItem(
  device: DeviceDocument,
  now: number = Date.now(),
): DeviceListItem {
  const lastSeen = device.lastSeenAt ?? null;
  return {
    id: device._id?.toString() ?? device.deviceId,
    deviceId: device.deviceId,
    name: device.name ?? null,
    macAddress: device.macAddress ?? null,
    mode: device.mode ?? "AUTO",
    status: computeDeviceStatus(lastSeen, now),
    lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : null,
    createdAt: device.createdAt ? new Date(device.createdAt).toISOString() : null,
  };
}
