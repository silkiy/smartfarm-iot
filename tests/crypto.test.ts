import { describe, expect, it } from "vitest";
import { generateApiKey, generateDeviceId, hashApiKey, MAC_ADDRESS_REGEX, API_KEY_MIN_BYTES } from "@/lib/crypto";

describe("device crypto", () => {
  it("generates a CSPRNG API key with >=32 bytes of entropy, base64url, not reused", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    // base64url of 32 bytes -> >=43 chars; no padding '='
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).not.toContain("=");
    expect(API_KEY_MIN_BYTES).toBeGreaterThanOrEqual(32);
  });

  it("hashes the API key with SHA-256 hex and is deterministic", () => {
    const key = generateApiKey();
    const h = hashApiKey(key);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toBe(key);
    expect(hashApiKey(key)).toBe(h);
  });

  it("generates unique device ids", () => {
    expect(generateDeviceId()).not.toBe(generateDeviceId());
  });

  it("MAC regex accepts standard form and rejects junk", () => {
    expect(MAC_ADDRESS_REGEX.test("AA:BB:CC:DD:EE:FF")).toBe(true);
    expect(MAC_ADDRESS_REGEX.test("aa:bb:cc:dd:ee:ff")).toBe(true);
    expect(MAC_ADDRESS_REGEX.test("AA-BB-CC-DD-EE-FF")).toBe(false);
    expect(MAC_ADDRESS_REGEX.test("not-a-mac")).toBe(false);
    expect(MAC_ADDRESS_REGEX.test("AA:BB:CC:DD:EE")).toBe(false);
  });
});
