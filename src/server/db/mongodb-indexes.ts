import { collectionNames } from "@/domain/models";
import type { Db } from "mongodb";

export async function ensureDatabaseIndexes(database: Db): Promise<void> {
  await Promise.all([
    database
      .collection(collectionNames.profiles)
      .createIndex(
        { userId: 1 },
        { unique: true, name: "profiles_user_id_unique" },
      ),
    database
      .collection(collectionNames.farms)
      .createIndex(
        { ownerUserId: 1, archivedAt: 1 },
        { name: "farms_owner_active" },
      ),
    database
      .collection(collectionNames.zones)
      .createIndex({ farmId: 1, isActive: 1 }, { name: "zones_farm_active" }),
    database
      .collection(collectionNames.irrigationRules)
      .createIndex({ zoneId: 1 }, { unique: true, name: "rules_zone_unique" }),
    database
      .collection(collectionNames.alerts)
      .createIndex({ farmId: 1, occurredAt: -1 }, { name: "alerts_farm_time" }),
    database
      .collection("auth_attempts")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "auth_attempts_expiry" },
      ),
    database
      .collection(collectionNames.profiles)
      .createIndex(
        { email: 1 },
        { unique: true, name: "profiles_email_unique" },
      ),
    database
      .collection(collectionNames.devices)
      .createIndex(
        { deviceId: 1 },
        { unique: true, name: "devices_device_id_unique" },
      ),
    database
      .collection(collectionNames.devices)
      .createIndex(
        { macAddress: 1 },
        { unique: true, name: "devices_mac_unique" },
      ),
    database
      .collection(collectionNames.sensorReadings)
      .createIndex(
        { deviceId: 1, measuredAt: -1 },
        { name: "readings_device_measured_at" },
      ),
    database
      .collection(collectionNames.sensorReadings)
      .createIndex(
        { zoneId: 1, measuredAt: -1 },
        { name: "readings_zone_measured_at" },
      ),
    database
      .collection(collectionNames.deviceCommands)
      .createIndex(
        { idempotencyKey: 1 },
        { unique: true, name: "commands_idempotency_unique" },
      ),
    database
      .collection(collectionNames.weatherRecords)
      .createIndex(
        { farmId: 1, fetchedAt: -1 },
        { name: "weather_farm_fetched_at" },
      ),
    // Index untuk polling perintah PENDING oleh ESP32
    database
      .collection(collectionNames.deviceCommands)
      .createIndex(
        { status: 1, createdAt: 1 },
        { name: "commands_status_time" },
      ),
    // Index untuk requestId idempotency ingest
    database
      .collection(collectionNames.sensorReadings)
      .createIndex(
        { requestId: 1 },
        { unique: true, name: "readings_request_id_unique" },
      ),
  ]);
}
