import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertFarmAccess,
  assertZoneAccess,
  AuthorizationError,
} from "../src/server/auth/policy";

const farm = { ownerUserId: "owner-1" };

describe("authorization policy", () => {
  it("allows admins to access any farm", () => {
    assert.doesNotThrow(() =>
      assertFarmAccess({ id: "admin", role: "ADMIN" }, farm),
    );
  });

  it("allows farm owners to access their own farm", () => {
    assert.doesNotThrow(() =>
      assertFarmAccess({ id: "owner-1", role: "LANDOWNER" }, farm),
    );
  });

  it("denies owners from accessing farms they do not own", () => {
    assert.throws(
      () => assertFarmAccess({ id: "other", role: "LANDOWNER" }, farm),
      AuthorizationError,
    );
  });

  it("assertZoneAccess delegates to assertFarmAccess", () => {
    assert.doesNotThrow(() =>
      assertZoneAccess({ id: "admin", role: "ADMIN" }, farm),
    );
    assert.doesNotThrow(() =>
      assertZoneAccess({ id: "owner-1", role: "LANDOWNER" }, farm),
    );
    assert.throws(
      () => assertZoneAccess({ id: "other", role: "LANDOWNER" }, farm),
      AuthorizationError,
    );
  });
});
