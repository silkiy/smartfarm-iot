import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import { AppError } from "@/lib/app-error";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth }));

const { requireAdmin, requireDeviceAccess, requireSession } = await import("@/lib/auth-guard");

function session(user: Record<string, unknown> | null) {
  return user ? { user } : null;
}

function fakeDb(findOne: ReturnType<typeof vi.fn>): Db {
  return { collection: () => ({ findOne }) } as unknown as Db;
}

const USER = { id: "user-1", name: "Siti", email: "siti@example.com", role: "USER" };
const ADMIN = { id: "admin-1", name: "Admin", email: "a@example.com", role: "ADMIN" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSession", () => {
  it("returns the session user", async () => {
    auth.mockResolvedValue(session(USER));
    await expect(requireSession()).resolves.toMatchObject({ id: "user-1", role: "USER" });
  });

  it("throws 401 when there is no session", async () => {
    auth.mockResolvedValue(null);
    await expect(requireSession()).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("throws 401 when the session has no user id", async () => {
    auth.mockResolvedValue(session({ name: "x" }));
    await expect(requireSession()).rejects.toBeInstanceOf(AppError);
  });
});

describe("requireAdmin", () => {
  it("allows ADMIN", async () => {
    auth.mockResolvedValue(session(ADMIN));
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("rejects USER with 403", async () => {
    auth.mockResolvedValue(session(USER));
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects unauthenticated with 401", async () => {
    auth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });
});

describe("requireDeviceAccess", () => {
  it("allows the owner", async () => {
    const findOne = vi.fn().mockResolvedValue({ deviceId: "d1", ownerId: "user-1" });
    const result = await requireDeviceAccess("d1", fakeDb(findOne), USER as never);
    expect(result.deviceId).toBe("d1");
    expect(findOne).toHaveBeenCalledWith({ deviceId: "d1" });
  });

  it("rejects a cross-user access with 403", async () => {
    const findOne = vi.fn().mockResolvedValue({ deviceId: "d1", ownerId: "someone-else" });
    await expect(requireDeviceAccess("d1", fakeDb(findOne), USER as never)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("allows ADMIN to access another user's device", async () => {
    const findOne = vi.fn().mockResolvedValue({ deviceId: "d1", ownerId: "someone-else" });
    await expect(requireDeviceAccess("d1", fakeDb(findOne), ADMIN as never)).resolves.toMatchObject({
      deviceId: "d1",
    });
  });

  it("throws 404 for an unknown device", async () => {
    const findOne = vi.fn().mockResolvedValue(null);
    await expect(requireDeviceAccess("nope", fakeDb(findOne), USER as never)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("uses only a validated scalar in the query (no raw object injection)", async () => {
    const findOne = vi.fn().mockResolvedValue({ deviceId: "d1", ownerId: "user-1" });
    await requireDeviceAccess("d1", fakeDb(findOne), USER as never);
    const filter = findOne.mock.calls[0]?.[0];
    expect(filter).toEqual({ deviceId: "d1" });
    expect(typeof (filter as { deviceId: unknown }).deviceId).toBe("string");
  });
});
