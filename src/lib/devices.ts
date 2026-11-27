import type { ObjectId } from "mongodb";

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
};
