import type { ObjectId } from "mongodb";

export const collectionNames = {
  profiles: "profiles",
  devices: "devices",
  sensorReadings: "sensor_readings",
  deviceCommands: "device_commands",
  alerts: "alerts",
} as const;

export type CollectionName = (typeof collectionNames)[keyof typeof collectionNames];

export type UserRole = "ADMIN" | "USER";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "DISABLED";
export type CommandStatus = "PENDING" | "RECEIVED" | "EXECUTED" | "FAILED";

export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDocument extends BaseDocument {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  passwordHash: string;
  /** Dinaikkan setiap reset password atau deaktivasi — revoke semua sesi lama */
  sessionVersion: number;
}

export interface DeviceDocument extends BaseDocument {
  /** MAC address ESP32 — identitas unik hardware */
  macAddress: string;
  /** Label yang diisi admin, contoh: ESP32-HIDROPONIK-01 */
  deviceId: string;
  name: string;
  status: DeviceStatus;
  lastSeenAt?: Date;
  /** SHA-256 dari DEVICE_FLEET_KEY */
  fleetKeyHash: string;
}

export interface SensorReadingDocument extends BaseDocument {
  deviceId: string;
  macAddress: string;
  measuredAt: Date;
  /** Idempotency key dari ESP32 */
  requestId: string;
  // Sensor fields — akan bertambah sesuai kebutuhan hidroponik
  [key: string]: unknown;
}

export interface DeviceCommandDocument extends BaseDocument {
  macAddress: string;
  actuator: string;
  action: string;
  status: CommandStatus;
  idempotencyKey: string;
  requestedBy?: string;
  receivedAt?: Date;
  executedAt?: Date;
  failureReason?: string;
}

export interface AlertDocument extends BaseDocument {
  type: string;
  title: string;
  message: string;
  occurredAt: Date;
  readByUserIds: string[];
}
