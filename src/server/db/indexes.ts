import type { Db } from "mongodb";
import { collectionNames } from "@/domain/models";

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db
      .collection(collectionNames.profiles)
      .createIndex({ userId: 1 }, { unique: true, name: "profiles_userId" }),
    db
      .collection(collectionNames.profiles)
      .createIndex({ username: 1 }, { unique: true, name: "profiles_username" }),
    db
      .collection(collectionNames.devices)
      .createIndex({ macAddress: 1 }, { unique: true, name: "devices_mac" }),
    db
      .collection(collectionNames.devices)
      .createIndex({ deviceId: 1 }, { unique: true, name: "devices_deviceId" }),
    db
      .collection(collectionNames.sensorReadings)
      .createIndex({ requestId: 1 }, { unique: true, name: "readings_requestId" }),
    db
      .collection(collectionNames.sensorReadings)
      .createIndex({ macAddress: 1, measuredAt: -1 }, { name: "readings_mac_time" }),
    db
      .collection(collectionNames.deviceCommands)
      .createIndex({ idempotencyKey: 1 }, { unique: true, name: "commands_idempotency" }),
    db
      .collection(collectionNames.deviceCommands)
      .createIndex({ status: 1, createdAt: 1 }, { name: "commands_status_time" }),
    db
      .collection("auth_attempts")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "auth_attempts_ttl" },
      ),
    db
      .collection("auth_attempts")
      .createIndex(
        { username: 1, createdAt: 1 },
        { name: "auth_attempts_username_time" },
      ),
  ]);
}
