import assert from "node:assert/strict";
import { test } from "node:test";
import { createDummyData, dummyBatch } from "../scripts/lib/dummy-data";
import { collectionNames } from "../src/domain/models";
test("dummy dataset has ten records per category with stable relationships", () => {
  const data = createDummyData({
    adminEmail: "admin@example.invalid",
    passwordHash: "hashed",
    now: new Date("2026-11-19T08:00:00Z"),
  });
  assert.equal(Object.keys(data).length, Object.keys(collectionNames).length);
  for (const rows of Object.values(data)) {
    assert.equal(rows.length, 10);
    assert.ok(rows.every((row) => row.isDemo && row.seedBatch === dummyBatch));
  }
  assert.equal(data.profiles.filter((p) => p.role === "ADMIN").length, 1);
  const users = new Set(data.profiles.map((p) => p.userId));
  const farms = new Set(data.farms.map((f) => String(f._id))),
    zones = new Set(data.zones.map((z) => String(z._id)));
  for (const farm of data.farms) assert.ok(users.has(farm.ownerUserId));
  for (const zone of data.zones) {
    assert.ok(farms.has(String(zone.farmId)));
  }
  for (const row of data.sensor_readings) {
    assert.ok(farms.has(row.farmId));
    assert.ok(zones.has(row.zoneId));
  }
  const again = createDummyData({
    adminEmail: "admin@example.invalid",
    passwordHash: "hashed",
  });
  assert.deepEqual(
    data.farms.map((f) => String(f._id)),
    again.farms.map((f) => String(f._id)),
  );
});
test("dummy data never queues hardware or claims actual message delivery", () => {
  const d = createDummyData({
    adminEmail: "admin@example.invalid",
    passwordHash: "hashed",
  });
  assert.ok(d.devices.every((x) => x.status === "DISABLED"));
  assert.ok(d.sensors.every((x) => x.isActive === false));
  assert.ok(d.device_commands.every((x) => x.status === "FAILED"));
  assert.ok(d.irrigation_rules.every((x) => x.isEnabled === false));
  assert.ok(d.notification_logs.every((x) => x.status === "FAILED"));
});
