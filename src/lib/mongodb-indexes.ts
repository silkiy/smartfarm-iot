import type { Db } from "mongodb";
import { collectionNames } from "@/domain/models";

export async function ensureDatabaseIndexes(database: Db): Promise<void> {
  await Promise.all([
    database
      .collection(collectionNames.profiles)
      .createIndex({ email: 1 }, { unique: true, name: "profiles_email_unique" }),
    database
      .collection(collectionNames.devices)
      .createIndex(
        { deviceId: 1 },
        { unique: true, name: "devices_device_id_unique" },
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
  ]);
}
