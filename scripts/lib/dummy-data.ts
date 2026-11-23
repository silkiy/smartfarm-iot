import { createHash, randomBytes } from "node:crypto";
import { ObjectId, type Document } from "mongodb";
import { collectionNames } from "../../src/domain/models";

export const dummyBatch = "smartfarm-dummy-v1";
const digest = (key: string) =>
  createHash("sha256").update(`${dummyBatch}:${key}`).digest("hex");
const objectId = (key: string) => new ObjectId(digest(key).slice(0, 24));
function userId(index: number) {
  const bytes = Buffer.from(digest(`user-${index}`).slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createDummyData({
  adminEmail,
  adminUserId,
  passwordHash,
  now = new Date(),
}: {
  adminEmail: string;
  adminUserId?: string;
  passwordHash: string;
  now?: Date;
}): Record<string, Document[]> {
  const data = Object.fromEntries(
    Object.values(collectionNames).map((name) => [name, []]),
  ) as Record<string, Document[]>;
  const ids = Array.from({ length: 10 }, (_, i) =>
    i === 0 && adminUserId ? adminUserId : userId(i),
  );
  function add(collection: string, i: number, fields: Document) {
    data[collection].push({
      _id: objectId(`${collection}-${i}`),
      ...fields,
      isDemo: true,
      seedBatch: dummyBatch,
      seedKey: `${collection}-${i}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  for (let i = 0; i < 10; i++) {
    const n = String(i + 1).padStart(2, "0");
    const farmId = objectId(`farms-${i}`),
      zoneId = objectId(`zones-${i}`),
      deviceId = objectId(`devices-${i}`),
      commandId = objectId(`device_commands-${i}`),
      alertId = objectId(`alerts-${i}`);
    const time = new Date(now.getTime() - (10 - i) * 60_000);
    const role = i === 0 ? "ADMIN" : "LANDOWNER";
    const ownerUserId = ids[1 + (i % 5)];
    const phase = ["Vegetatif", "Generatif", "Pematangan"][i % 3];
    add("profiles", i, {
      userId: ids[i],
      email:
        i === 0 ? adminEmail : `pemilik${String(i).padStart(2, "0")}@dummy.com`,
      displayName: i === 0 ? "Silki (Admin Dummy)" : `Dummy Pemilik ${n}`,
      role,
      isActive: true,
      passwordHash,
      sessionVersion: 0,
      preferences: { web: true, whatsapp: false },
    });
    add("farms", i, {
      name: `Dummy Sawah ${n}`,
      ownerUserId,
      location: `Dummy Blok ${n}, Lamongan`,
      areaM2: 1000 + i * 250,
      phase,
      latitude: -7.1 - i * 0.001,
      longitude: 112.4 + i * 0.001,
    });
    add("zones", i, {
      farmId,
      name: `Dummy Petak ${n}`,
      growthPhase: phase,
      isActive: true,
    });
    add("devices", i, {
      deviceId: `dummy-esp32-${n}`,
      farmId,
      zoneId,
      name: `Dummy ESP32 ${n}`,
      status: "DISABLED",
      credentialHash: createHash("sha256")
        .update(randomBytes(32))
        .digest("hex"),
    });
    add("sensors", i, {
      deviceId,
      farmId,
      zoneId,
      type: i % 2 ? "WATER_LEVEL" : "SOIL_MOISTURE",
      name: `Dummy Sensor ${n}`,
      isActive: false,
    });
    add("sensor_readings", i, {
      deviceId: `dummy-esp32-${n}`,
      farmId: farmId.toHexString(),
      zoneId: zoneId.toHexString(),
      soilMoisture: 35 + i * 5,
      waterLevelCm: 3 + i * 0.5,
      pumpStatus: "OFF",
      valveStatus: "CLOSED",
      measuredAt: time,
      requestId: `${dummyBatch}-reading-${n}`,
    });
    add("irrigation_rules", i, {
      farmId,
      zoneId,
      isEnabled: false,
      minimumSoilMoisture: 40,
      maximumWaterLevelCm: 8,
      schedule: "06:00",
      growthPhase: phase,
      maximumDurationSeconds: 15,
      executionStatus: "AWAITING_HARDWARE",
    });
    add("device_commands", i, {
      deviceId,
      farmId,
      zoneId,
      actuator: "PUMP",
      action: "OFF",
      status: "FAILED",
      idempotencyKey: `${dummyBatch}-command-${n}`,
      requestedBy: ids[0],
      failureReason: "DUMMY_ONLY_NOT_DISPATCHED",
    });
    add("irrigation_events", i, {
      farmId,
      zoneId,
      deviceCommandId: commandId,
      trigger: "MANUAL",
      startedAt: time,
      endedAt: time,
      result: "FAILED",
    });
    add("alerts", i, {
      farmId,
      zoneId,
      type: i % 2 ? "SYSTEM" : "WARNING",
      title: `[DUMMY] Pemeriksaan petak ${n}`,
      message:
        "Data simulasi untuk mencoba notifikasi. Tidak berasal dari perangkat fisik.",
      isRead: false,
      readByUserIds: [],
      occurredAt: time,
    });
    add("notification_logs", i, {
      alertId,
      channel: "WEB",
      recipient: ownerUserId,
      status: "FAILED",
      failureReason: "DUMMY_ONLY_NOT_DELIVERED",
    });
    add("weather_records", i, {
      farmId,
      provider: "DUMMY",
      location: `Dummy Blok ${n}`,
      latitude: -7.1 - i * 0.001,
      longitude: 112.4 + i * 0.001,
      temperatureC: 26 + i * 0.5,
      humidityPercent: 65 + i,
      precipitationMm: i % 3,
      observedAt: time,
      fetchedAt: time,
    });
  }
  return data;
}
