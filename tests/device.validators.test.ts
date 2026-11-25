import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ingestSchema,
  deviceRegistrationSchema,
  macAddressSchema,
  provisionRequestSchema,
} from "../src/domain/device";

test("MAC address schema validates format strictly", () => {
  // Valid — huruf besar
  assert.equal(macAddressSchema.safeParse("AA:BB:CC:DD:EE:FF").success, true);
  // Valid — huruf kecil, di-transform ke uppercase
  const result = macAddressSchema.safeParse("aa:bb:cc:dd:ee:ff");
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data, "AA:BB:CC:DD:EE:FF");

  // Invalid
  for (const bad of [
    "AA:BB:CC:DD:EE", // kurang satu oktet
    "AA:BB:CC:DD:EE:FF:00", // lebih satu oktet
    "AABBCCDDEEFF", // tanpa titik dua
    "AA-BB-CC-DD-EE-FF", // pakai dash bukan colon
    "GG:BB:CC:DD:EE:FF", // karakter bukan hex
    "",
    "00:00:00:00:00:0G",
  ]) {
    assert.equal(
      macAddressSchema.safeParse(bad).success,
      false,
      `expected rejection for: ${bad}`,
    );
  }
});

test("provision request requires valid MAC address", () => {
  assert.equal(
    provisionRequestSchema.safeParse({ macAddress: "AA:BB:CC:DD:EE:FF" })
      .success,
    true,
  );
  assert.equal(
    provisionRequestSchema.safeParse({ macAddress: "invalid" }).success,
    false,
  );
  assert.equal(
    provisionRequestSchema.safeParse({
      macAddress: "AA:BB:CC:DD:EE:FF",
      extra: "field",
    }).success,
    false,
  );
});

test("ingest rejects out-of-range sensor values and invalid MAC", () => {
  const valid = {
    macAddress: "AA:BB:CC:DD:EE:FF",
    soilMoisture: 65,
    waterLevelCm: 8.5,
    pumpStatus: "OFF",
    valveStatus: "CLOSED",
    requestId: "8d2b2752-bb0f-4a97-889f-54558397bc56",
  };
  assert.equal(ingestSchema.safeParse(valid).success, true);

  for (const change of [
    { macAddress: "not-a-mac" },
    { soilMoisture: -1 },
    { soilMoisture: 101 },
    { waterLevelCm: -1 },
    { waterLevelCm: 101 },
    { pumpStatus: "OPEN" },
    { valveStatus: "ON" },
    { requestId: "not-a-uuid" },
  ]) {
    assert.equal(
      ingestSchema.safeParse({ ...valid, ...change }).success,
      false,
      `expected rejection for ${JSON.stringify(change)}`,
    );
  }
});

test("device registration rejects invalid MAC, farmId, and zoneId", () => {
  const valid = {
    macAddress: "AA:BB:CC:DD:EE:FF",
    deviceId: "ESP32-SAWAH-01",
    name: "Sensor Petak 1",
    farmId: "a".repeat(24),
    zoneId: "b".repeat(24),
  };
  assert.equal(deviceRegistrationSchema.safeParse(valid).success, true);

  assert.equal(
    deviceRegistrationSchema.safeParse({ ...valid, macAddress: "INVALID" })
      .success,
    false,
  );
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
    deviceRegistrationSchema.safeParse({ ...valid, deviceId: "" }).success,
    false,
  );
});
