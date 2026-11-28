import { describe, expect, it } from "vitest";
import { computeDeviceStatus, OFFLINE_THRESHOLD_MS } from "@/lib/device-status";

describe("computeDeviceStatus", () => {
  const now = new Date("2026-11-27T12:00:00.000Z").getTime();

  it("ONLINE when now - lastSeenAt <= 30s", () => {
    expect(computeDeviceStatus(new Date(now - OFFLINE_THRESHOLD_MS).toISOString(), now)).toBe("ONLINE");
    expect(computeDeviceStatus(new Date(now - 1000).toISOString(), now)).toBe("ONLINE");
    expect(computeDeviceStatus(new Date(now).toISOString(), now)).toBe("ONLINE");
  });

  it("OFFLINE when now - lastSeenAt > 30s (30.0 online vs 30.1 offline)", () => {
    expect(computeDeviceStatus(new Date(now - OFFLINE_THRESHOLD_MS - 100).toISOString(), now)).toBe("OFFLINE");
  });

  it("OFFLINE when never connected (null/undefined/invalid)", () => {
    expect(computeDeviceStatus(null, now)).toBe("OFFLINE");
    expect(computeDeviceStatus(undefined, now)).toBe("OFFLINE");
    expect(computeDeviceStatus("not-a-date", now)).toBe("OFFLINE");
  });

  it("OFFLINE_THRESHOLD_MS is 30000", () => {
    expect(OFFLINE_THRESHOLD_MS).toBe(30_000);
  });
});
