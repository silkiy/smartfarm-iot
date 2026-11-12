import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertZoneAccess, AuthorizationError } from "../src/lib/authz/policy";

const farm = { ownerUserId: "owner-1" };
const zone = {
  assignedUserIds: ["worker-1", "worker-controller"],
  controlUserIds: ["worker-controller"],
};

describe("authorization policy", () => {
  it("allows admins and farm owners to read their resources", () => {
    assert.doesNotThrow(() =>
      assertZoneAccess({ id: "admin", role: "ADMIN" }, farm, zone, "READ"),
    );
    assert.doesNotThrow(() =>
      assertZoneAccess({ id: "owner-1", role: "LANDOWNER" }, farm, zone, "READ"),
    );
  });

  it("allows assigned workers to read but not control by default", () => {
    assert.doesNotThrow(() =>
      assertZoneAccess({ id: "worker-1", role: "FIELD_WORKER" }, farm, zone, "READ"),
    );
    assert.throws(
      () =>
        assertZoneAccess(
          { id: "worker-1", role: "FIELD_WORKER" },
          farm,
          zone,
          "CONTROL",
        ),
      AuthorizationError,
    );
  });

  it("allows control only for explicitly permitted workers", () => {
    assert.doesNotThrow(() =>
      assertZoneAccess(
        { id: "worker-controller", role: "FIELD_WORKER" },
        farm,
        zone,
        "CONTROL",
      ),
    );
  });
});
