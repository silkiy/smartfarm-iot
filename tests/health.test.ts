import assert from "node:assert/strict";
import { test } from "node:test";

// Smoke test — pastikan modul domain bisa di-import tanpa error
test("domain models export collectionNames", async () => {
  const { collectionNames } = await import("../src/domain/models");
  assert.ok(collectionNames.profiles);
  assert.ok(collectionNames.devices);
  assert.ok(collectionNames.sensorReadings);
  assert.ok(collectionNames.deviceCommands);
  assert.ok(collectionNames.alerts);
});

test("cn utility merges class names correctly", async () => {
  const { cn } = await import("../src/lib/cn");
  assert.equal(cn("a", "b"), "a b");
  assert.equal(cn("a", false, "b"), "a b");
  assert.equal(cn(undefined, "b"), "b");
  assert.equal(cn(), "");
});
