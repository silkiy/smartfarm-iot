import { beforeEach, describe, expect, it, vi } from "vitest";

const findOne = vi.fn();
const deleteOne = vi.fn();
const updateOne = vi.fn();
const collection = vi.fn(() => ({ findOne, deleteOne, updateOne }));

vi.mock("@/lib/db", () => ({ getDb: vi.fn(async () => ({ collection })) }));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1", name: "Siti", email: "s@example.com", role: "USER" } })) }));

const { DELETE } = await import("@/app/api/devices/[deviceId]/route");
const { POST } = await import("@/app/api/devices/[deviceId]/reset-key/route");

const deviceOwned = { deviceId: "d1", ownerId: "user-1" };

function params(deviceId: string) { return { params: Promise.resolve({ deviceId }) }; }

beforeEach(() => {
  vi.clearAllMocks();
  findOne.mockResolvedValue(deviceOwned);
  deleteOne.mockResolvedValue({ deletedCount: 1 });
  updateOne.mockResolvedValue({ matchedCount: 1 });
  collection.mockReturnValue({ findOne, deleteOne, updateOne });
});

describe("DELETE /api/devices/[deviceId]", () => {
  it("deletes own device -> 204", async () => {
    const res = await DELETE(new Request("http://x"), params("d1"));
    expect(res.status).toBe(204);
    expect(deleteOne).toHaveBeenCalledWith({ deviceId: "d1" });
  });

  it("rejects cross-user with 403 and does not delete", async () => {
    findOne.mockResolvedValue({ deviceId: "d1", ownerId: "other" });
    const res = await DELETE(new Request("http://x"), params("d1"));
    expect(res.status).toBe(403);
    expect(deleteOne).not.toHaveBeenCalled();
  });

  it("unknown device -> 404", async () => {
    findOne.mockResolvedValue(null);
    const res = await DELETE(new Request("http://x"), params("d1"));
    expect(res.status).toBe(404);
    expect(deleteOne).not.toHaveBeenCalled();
  });

  it("invalid deviceId param -> 400", async () => {
    const res = await DELETE(new Request("http://x"), params("bad id!"));
    expect(res.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe("POST /api/devices/[deviceId]/reset-key", () => {
  it("rotates key, stores only SHA-256, returns one-time key, hides apiKeyHash", async () => {
    const res = await POST(new Request("http://x"), params("d1"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(typeof json.data.apiKey).toBe("string");
    expect(JSON.stringify(json)).not.toContain("apiKeyHash");

    const update = updateOne.mock.calls[0];
    expect(update?.[0]).toEqual({ deviceId: "d1" });
    const set = (update?.[1] as { $set: { apiKeyHash: string } }).$set;
    expect(set.apiKeyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(set.apiKeyHash).not.toBe(json.data.apiKey);
  });

  it("old key invalidated by replacing apiKeyHash", async () => {
    await POST(new Request("http://x"), params("d1"));
    const set = (updateOne.mock.calls[0]?.[1] as { $set: { apiKeyHash: string } }).$set;
    expect(set.apiKeyHash).not.toBe("oldhash");
  });

  it("rejects cross-user with 403 and does not update", async () => {
    findOne.mockResolvedValue({ deviceId: "d1", ownerId: "other" });
    const res = await POST(new Request("http://x"), params("d1"));
    expect(res.status).toBe(403);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("unknown device -> 404", async () => {
    findOne.mockResolvedValue(null);
    const res = await POST(new Request("http://x"), params("d1"));
    expect(res.status).toBe(404);
  });
});

describe("isolation between two users", () => {
  it("user A cannot delete/reset user B's device", async () => {
    findOne.mockResolvedValue({ deviceId: "d1", ownerId: "user-B" });
    expect((await DELETE(new Request("http://x"), params("d1"))).status).toBe(403);
    expect((await POST(new Request("http://x"), params("d1"))).status).toBe(403);
  });
});
