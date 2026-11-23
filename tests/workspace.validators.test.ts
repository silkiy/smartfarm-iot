import assert from "node:assert/strict";
import { test } from "node:test";
import {
  farmInputSchema,
  ruleInputSchema,
  userInputSchema,
} from "../src/domain/workspace";

test("farm validates numeric area, paired coordinates, and rejects ownership injection", () => {
  const input = {
    name: " Sawah ",
    location: "Lamongan",
    areaM2: 2500,
    phase: "Vegetatif",
  };
  assert.equal(farmInputSchema.parse(input).name, "Sawah");
  assert.equal(
    farmInputSchema.safeParse({ ...input, ownerUserId: "other" }).success,
    false,
  );
  assert.equal(
    farmInputSchema.safeParse({ ...input, latitude: -7 }).success,
    false,
  );
  assert.equal(
    farmInputSchema.safeParse({ ...input, areaM2: "2500" }).success,
    false,
  );
});

test("rule rejects invalid schedules and values instead of silently clamping", () => {
  const input = {
    enabled: true,
    phase: "Vegetatif",
    threshold: 40,
    target: 8,
    schedule: "06:00",
  };
  assert.equal(ruleInputSchema.safeParse(input).success, true);
  for (const change of [
    { schedule: "25:00" },
    { target: 21 },
    { threshold: -1 },
  ]) {
    assert.equal(
      ruleInputSchema.safeParse({ ...input, ...change }).success,
      false,
    );
  }
});

test("new accounts reject FIELD_WORKER role and short passwords", () => {
  assert.equal(
    userInputSchema.safeParse({
      email: "user@example.com",
      displayName: "Owner",
      password: "123456789",
      role: "FIELD_WORKER",
    }).success,
    false,
  );
  assert.equal(
    userInputSchema.safeParse({
      email: "user@example.com",
      displayName: "Owner",
      password: "12345678",
      role: "ADMIN",
    }).success,
    false,
  );
  assert.equal(
    userInputSchema.safeParse({
      email: "user@example.com",
      displayName: "Owner",
      password: "123456789",
      role: "LANDOWNER",
    }).success,
    true,
  );
});
