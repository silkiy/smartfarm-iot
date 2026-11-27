import assert from "node:assert/strict";
import { test } from "node:test";

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

test("login schema validates username and password", async () => {
  const { loginSchema } = await import("../src/domain/auth");

  // Valid
  assert.equal(
    loginSchema.safeParse({ username: "admin", password: "password123" }).success,
    true,
  );

  // Username terlalu pendek
  assert.equal(
    loginSchema.safeParse({ username: "ab", password: "password123" }).success,
    false,
  );

  // Username pakai huruf besar
  assert.equal(
    loginSchema.safeParse({ username: "Admin", password: "password123" }).success,
    false,
  );

  // Username pakai spasi
  assert.equal(
    loginSchema.safeParse({ username: "admin user", password: "password123" }).success,
    false,
  );

  // Password terlalu pendek
  assert.equal(
    loginSchema.safeParse({ username: "admin", password: "short" }).success,
    false,
  );
});
