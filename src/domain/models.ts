import type { ObjectId } from "mongodb";

export const collectionNames = {
  profiles: "profiles",
  farms: "farms",
  zones: "zones",
  devices: "devices",
  sensors: "sensors",
  sensorReadings: "sensor_readings",
  irrigationRules: "irrigation_rules",
  deviceCommands: "device_commands",
  irrigationEvents: "irrigation_events",
  alerts: "alerts",
  notificationLogs: "notification_logs",
  weatherRecords: "weather_records",
} as const;

export type CollectionName =
  (typeof collectionNames)[keyof typeof collectionNames];

export type UserRole = "ADMIN" | "LANDOWNER" | "FIELD_WORKER";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "DISABLED";
export type ActuatorStatus = "ON" | "OFF" | "OPEN" | "CLOSED";
export type CommandStatus = "PENDING" | "RECEIVED" | "EXECUTED" | "FAILED";

export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDocument extends BaseDocument {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
}

export interface FarmDocument extends BaseDocument {
  name: string;
  ownerUserId: string;
  location?: string;
}

export interface ZoneDocument extends BaseDocument {
  farmId: ObjectId;
  name: string;
  growthPhase?: string;
  isActive: boolean;
}

export interface DeviceDocument extends BaseDocument {
  deviceId: string;
  farmId: ObjectId;
  zoneId: ObjectId;
  name: string;
  status: DeviceStatus;
  lastSeenAt?: Date;
  credentialHash: string;
}

export interface SensorDocument extends BaseDocument {
  deviceId: ObjectId;
  farmId: ObjectId;
  zoneId: ObjectId;
  type: "SOIL_MOISTURE" | "WATER_LEVEL";
  name: string;
  isActive: boolean;
}

export interface SensorReadingDocument extends BaseDocument {
  deviceId: string;
  farmId: string;
  zoneId: string;
  soilMoisture: number;
  waterLevelCm: number;
  pumpStatus: ActuatorStatus;
  valveStatus: ActuatorStatus;
  measuredAt: Date;
  requestId: string;
}

export interface IrrigationRuleDocument extends BaseDocument {
  farmId: ObjectId;
  zoneId: ObjectId;
  isEnabled: boolean;
  minimumSoilMoisture?: number;
  maximumWaterLevelCm?: number;
  schedule?: string;
  growthPhase?: string;
  maximumDurationSeconds: number;
}

export interface DeviceCommandDocument extends BaseDocument {
  deviceId: ObjectId;
  farmId: ObjectId;
  zoneId: ObjectId;
  actuator: "PUMP" | "VALVE";
  action: "ON" | "OFF" | "OPEN" | "CLOSED";
  durationSeconds?: number;
  status: CommandStatus;
  idempotencyKey: string;
  requestedBy?: string;
  receivedAt?: Date;
  executedAt?: Date;
  failureReason?: string;
}

export interface IrrigationEventDocument extends BaseDocument {
  farmId: ObjectId;
  zoneId: ObjectId;
  deviceCommandId: ObjectId;
  trigger: "MANUAL" | "AUTOMATIC";
  startedAt: Date;
  endedAt?: Date;
  result: "RUNNING" | "COMPLETED" | "FAILED" | "STOPPED_SAFELY";
}

export interface AlertDocument extends BaseDocument {
  farmId: ObjectId;
  zoneId?: ObjectId;
  type: string;
  message: string;
  isRead: boolean;
  occurredAt: Date;
}

export interface NotificationLogDocument extends BaseDocument {
  alertId: ObjectId;
  channel: "WHATSAPP" | "WEB";
  recipient: string;
  status: "PENDING" | "SENT" | "FAILED";
  providerMessageId?: string;
  failureReason?: string;
  sentAt?: Date;
}

export interface WeatherRecordDocument extends BaseDocument {
  farmId: ObjectId;
  provider: string;
  location: string;
  temperatureC?: number;
  humidityPercent?: number;
  precipitationMm?: number;
  observedAt: Date;
  fetchedAt: Date;
}
