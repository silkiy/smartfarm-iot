/** AGENT.md §5 #10: `OFFLINE` when `now - lastSeenAt > 30_000` or never connected. */
export const OFFLINE_THRESHOLD_MS = 30_000;

export type DeviceStatus = "ONLINE" | "OFFLINE";

/**
 * Pure, on-read device status. A single source of truth. Strict `>` threshold:
 * exactly 30s is ONLINE, 30.1s is OFFLINE. Unknown/invalid `lastSeenAt` =>
 * OFFLINE (never seen). `now` is injectable for deterministic tests.
 */
export function computeDeviceStatus(
  lastSeenAt: Date | string | null | undefined,
  now: number = Date.now(),
): DeviceStatus {
  if (lastSeenAt == null) return "OFFLINE";

  const lastSeenMs = lastSeenAt instanceof Date ? lastSeenAt.getTime() : Date.parse(String(lastSeenAt));
  if (!Number.isFinite(lastSeenMs)) return "OFFLINE";

  return now - lastSeenMs > OFFLINE_THRESHOLD_MS ? "OFFLINE" : "ONLINE";
}
