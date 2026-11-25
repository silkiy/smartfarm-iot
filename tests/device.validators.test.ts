import assert from "node:assert/strict";
import { test } from "node:test";
import { ingestSchema, deviceRegistrationSchema } from "../src/domain/device";

test("ingest rejects out-of-range sensor values", () => {
  const valid = {
    deviceId: "ESP32-001",
    soilMoisture: 65,
    waterLevelCm: 8.5,
    pumpStatus: "OFF",
    valveStatus: "CLOSED",
    requestId: "8d2b2752-bb0f-4a97-889f-54558397bc56",
  };
  assert.equal(ingestSchema.safeParse(valid).success, true);

  for (const change of [
    { soilMoisture: -1 },
    { soilMoisture: 101 },
    { waterLevelCm: -1 },
    { waterLevelCm: 101 },
    { pumpStatus: "OPEN" },
    { valveStatus: "ON" },
    { requestId: "not-a-uuid" },
    { deviceId: "" },
  ]) {
    assert.equal(
      ingestSchema.safeParse({ ...valid, ...change }).success,
      false,
      `expected rejection for ${JSON.stringify(change)}`,
    );
  }
});

test("device registration rejects invalid farmId/zoneId lengths", () => {
  const valid = {
    deviceId: "ESP32-001",
    name: "Sensor Petak 1",
    farmId: "a".repeat(24),
    zoneId: "b".repeat(24),
  };
  assert.equal(deviceRegistrationSchema.safeParse(valid).success, true);

  assert.equal(
    deviceRegistrationSchema.safeParse({ ...valid, farmId: "tooshort" })
      .success,
    false,
  );
  assert.equal(
    deviceRegistrationSchema.safeParse({ ...valid, zoneId: "" }).success,
    false,
  );
  assert.equal(
    deviceRegistrationSchema.safeParse({ ...valid, name: "" }).success,
    false,
  );
});
