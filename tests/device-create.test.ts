import { beforeEach, describe, expect, it, vi } from "vitest";

const findOne = vi.fn();
const insertOne = vi.fn();
const collection = vi.fn(() => ({ findOne, insertOne }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn(async () => ({ collection })) }));
vi.mock("@/lib/auth-guard", () => ({
  requireSession: vi.fn(async () => ({ id: "user-1", name: "Siti", email: "s@example.com", role: "USER" })),
}));

const { POST } = await import("@/app/api/devices/route");

function req(body: unknown): Request {
  return new Request("http://localhost/api/devices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = { name: "Rak Kangkung 1", macAddress: "AA:BB:CC:DD:EE:FF" };

beforeEach(() => {
  vi.clearAllMocks();
  findOne.mockResolvedValue(null);
  insertOne.mockResolvedValue({ insertedId: { toString: () => "objid-1" } });
  collection.mockReturnValue({ findOne, insertOne });
});

describe("POST /api/devices", () => {
  it("creates a device, returns one-time apiKey, hides apiKeyHash, sets ownerId + safe defaults", async () => {
    const res = await POST(req(valid));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(typeof json.data.apiKey).toBe("string");
    expect(json.data.apiKey.length).toBeGreaterThanOrEqual(43);
    expect(JSON.stringify(json)).not.toContain("apiKeyHash");

    const inserted = insertOne.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted.ownerId).toBe("user-1");
    expect(inserted.apiKeyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted.apiKeyHash).not.toBe(json.data.apiKey);
    expect(inserted.macAddress).toBe("AA:BB:CC:DD:EE:FF");
    expect(inserted.mode).toBe("AUTO");
    expect(inserted.desiredPumpState).toBe(false);
    expect(inserted.createdAt).toBeInstanceOf(Date);
    // no server telemetry / safety fields invented at creation
    expect(inserted.lastWaterDistanceCm).toBeUndefined();
  });

  it("auto-generates deviceId when omitted; accepts manual valid deviceId", async () => {
    await POST(req(valid));
    const auto = insertOne.mock.calls[0]?.[0] as { deviceId: string };
    expect(typeof auto.deviceId).toBe("string");
    expect(auto.deviceId.length).toBeGreaterThan(0);

    vi.clearAllMocks(); findOne.mockResolvedValue(null); insertOne.mockResolvedValue({ insertedId: { toString: () => "x" } }); collection.mockReturnValue({ findOne, insertOne });
    await POST(req({ ...valid, deviceId: "rak-1" }));
    expect((insertOne.mock.calls[0]?.[0] as { deviceId: string }).deviceId).toBe("rak-1");
  });

  it("ignores client-supplied ownerId / apiKeyHash / role / mode", async () => {
    await POST(req({ ...valid, ownerId: "attacker", apiKeyHash: "x", role: "ADMIN", mode: "MANUAL" }));
    const inserted = insertOne.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted.ownerId).toBe("user-1");
    expect(inserted.apiKeyHash).not.toBe("x");
    expect(inserted.role).toBeUndefined();
    expect(inserted.mode).toBe("AUTO");
  });

  it("rejects invalid body with 400", async () => {
    const cases = [{}, { name: "", macAddress: valid.macAddress }, { name: "x", macAddress: "not-a-mac" }, { name: "x", macAddress: valid.macAddress, deviceId: "bad id!" }, "not json"];
    for (const c of cases) {
      const res = await POST(req(c));
      expect(res.status).toBe(400);
    }
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("rejects duplicate deviceId with 409", async () => {
    findOne.mockImplementation(async (filter: Record<string, unknown>) => (filter.deviceId ? { deviceId: "rak-1" } : null));
    const res = await POST(req({ ...valid, deviceId: "rak-1" }));
    expect(res.status).toBe(409);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("rejects duplicate macAddress with 409", async () => {
    findOne.mockImplementation(async (filter: Record<string, unknown>) => (filter.macAddress ? { macAddress: valid.macAddress } : null));
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("maps unique-index race (11000) to 409", async () => {
    insertOne.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
  });

  it("returns generic 500 without leaking internals", async () => {
    insertOne.mockRejectedValue(new Error("mongodb+srv://u:secret@cluster boom"));
    const res = await POST(req(valid));
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("mongodb");
  });

  it("sets Cache-Control no-store", async () => {
    const res = await POST(req(valid));
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
