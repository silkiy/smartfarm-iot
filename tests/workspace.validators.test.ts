import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assignmentSchema,
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
test("assignments require control users to be assigned, new accounts validate roles/passwords", () => {
  const id = "8d2b2752-bb0f-4a97-889f-54558397bc56";
  assert.equal(
    assignmentSchema.safeParse({ assignedUserIds: [], controlUserIds: [id] })
      .success,
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
});
