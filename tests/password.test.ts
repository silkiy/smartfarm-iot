import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes with bcrypt at cost 12 and verifies correctly", async () => {
    const hash = await hashPassword("rahasia-kuat-123");

    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain("rahasia-kuat-123");
    await expect(verifyPassword("rahasia-kuat-123", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("rahasia-kuat-123");
    await expect(verifyPassword("salah", hash)).resolves.toBe(false);
  });

  it("produces a unique salt per call", async () => {
    const a = await hashPassword("sama");
    const b = await hashPassword("sama");
    expect(a).not.toBe(b);
  });
});
