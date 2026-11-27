import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import { hashPassword } from "@/lib/password";
import { authenticateCredentials } from "@/lib/authenticate";

const findOne = vi.fn();
function fakeDb(): Db {
  return { collection: () => ({ findOne }) } as unknown as Db;
}

let storedHash: string;

beforeEach(async () => {
  vi.clearAllMocks();
  storedHash = await hashPassword("rahasia-kuat-123");
});

const user = (over: Record<string, unknown> = {}) => ({
  _id: { toString: () => "user-1" },
  name: "Siti",
  email: "siti@example.com",
  passwordHash: storedHash,
  role: "USER",
  ...over,
});

describe("authenticateCredentials", () => {
  it("returns a safe user for valid credentials", async () => {
    findOne.mockResolvedValue(user());
    const result = await authenticateCredentials("siti@example.com", "rahasia-kuat-123", fakeDb());

    expect(result).toEqual({ id: "user-1", name: "Siti", email: "siti@example.com", role: "USER" });
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(findOne).toHaveBeenCalledWith({ email: "siti@example.com" }, expect.anything());
  });

  it("returns null (generic) for unknown email", async () => {
    findOne.mockResolvedValue(null);
    await expect(authenticateCredentials("ghost@example.com", "x", fakeDb())).resolves.toBeNull();
  });

  it("returns null for a wrong password", async () => {
    findOne.mockResolvedValue(user());
    await expect(authenticateCredentials("siti@example.com", "salah", fakeDb())).resolves.toBeNull();
  });

  it("does not reveal which field was wrong", async () => {
    findOne.mockResolvedValueOnce(null);
    const unknown = await authenticateCredentials("a@example.com", "x", fakeDb());
    findOne.mockResolvedValueOnce(user());
    const wrongPassword = await authenticateCredentials("siti@example.com", "nope", fakeDb());

    expect(unknown).toBeNull();
    expect(wrongPassword).toBeNull();
  });

  it("preserves the stored role", async () => {
    findOne.mockResolvedValue(user({ role: "ADMIN" }));
    const result = await authenticateCredentials("siti@example.com", "rahasia-kuat-123", fakeDb());
    expect(result?.role).toBe("ADMIN");
  });
});
