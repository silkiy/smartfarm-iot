import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSensorReadingInput } from "../src/domain/validators";

describe("sensor reading validator", () => {
  it("accepts a valid reading", () => {
    const reading = parseSensorReadingInput({
      deviceId: "ESP32-001",
      farmId: "SAWAH-001",
      zoneId: "ZONA-01",
      soilMoisture: 65,
      waterLevelCm: 8.5,
      pumpStatus: "OFF",
      valveStatus: "CLOSED",
      measuredAt: "2026-11-12T03:00:00.000Z",
      requestId: "reading-001",
    });

    assert.equal(reading.soilMoisture, 65);
    assert.equal(reading.measuredAt instanceof Date, true);
  });

  it("rejects out-of-range sensor values and unknown fields", () => {
    assert.throws(() =>
      parseSensorReadingInput({
        deviceId: "ESP32-001",
        farmId: "SAWAH-001",
        zoneId: "ZONA-01",
        soilMoisture: 101,
        waterLevelCm: 8.5,
        pumpStatus: "OFF",
        valveStatus: "CLOSED",
        measuredAt: "2026-11-12T03:00:00.000Z",
        requestId: "reading-001",
        unexpected: true,
      }),
    );
  });
});
