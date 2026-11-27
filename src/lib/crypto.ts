import { createHash, randomBytes, randomUUID } from "node:crypto";

/** Device API key strength. AGENT.md §5 #13: cryptographic random >= 32 bytes. */
export const API_KEY_MIN_BYTES = 32;

/** PANDUAN.md §11.2 / AGENT.md §11.2: macAddress `AA:BB:CC:DD:EE:FF`. */
export const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

/** CSPRNG device API key, returned once; stored only as `hashApiKey`. */
export function generateApiKey(): string {
  return randomBytes(API_KEY_MIN_BYTES).toString("base64url");
}

/** SHA-256 hex of the API key; `apiKeyHash`. Never logged or returned. */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}

/** Auto-generate a `deviceId`. */
export function generateDeviceId(): string {
  return randomUUID();
}
