import { beforeEach, describe, expect, it, vi } from "vitest";

const findOne = vi.fn();
const insertOne = vi.fn();
const collection = vi.fn(() => ({ findOne, insertOne }));
const getDb = vi.fn(async () => ({ collection }));

vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true, retryAfterSeconds: 0 })),
  resetRateLimitStore: vi.fn(),
  clientKey: vi.fn(() => "test-client"),
}));

const { POST } = await import("@/app/api/auth/register/route");
const { verifyPassword } = await import("@/lib/password");

function registerRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = { name: "Siti", email: "siti@example.com", password: "rahasia-kuat-123" };

beforeEach(() => {
  vi.clearAllMocks();
  findOne.mockResolvedValue(null);
  insertOne.mockResolvedValue({ insertedId: { toString: () => "66f0a1b2c3d4e5f60718293a" } });
  getDb.mockResolvedValue({ collection });
  collection.mockReturnValue({ findOne, insertOne });
});

describe("POST /api/auth/register", () => {
  it("creates a user with server-set role USER and returns 201 without passwordHash", async () => {
    const res = await POST(registerRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data.role).toBe("USER");
    expect(json.data.id).toBe("66f0a1b2c3d4e5f60718293a");
    expect(JSON.stringify(json)).not.toContain("passwordHash");
    expect(json.data.password).toBeUndefined();

    const inserted = insertOne.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted.role).toBe("USER");
    expect(inserted.email).toBe("siti@example.com");
    expect(inserted.createdAt).toBeInstanceOf(Date);
    expect(typeof inserted.passwordHash).toBe("string");
    expect(inserted.passwordHash).not.toBe(validBody.password);
  });

  it("stores a bcrypt hash that verifies against the plain password", async () => {
    await POST(registerRequest(validBody));
    const inserted = insertOne.mock.calls[0]?.[0] as { passwordHash: string };

    expect(inserted.passwordHash).toMatch(/^\$2[aby]\$/);
    await expect(verifyPassword(validBody.password, inserted.passwordHash)).resolves.toBe(true);
  });

  it("ignores a client-supplied role and never stores it", async () => {
    await POST(registerRequest({ ...validBody, role: "ADMIN" }));
    const inserted = insertOne.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(inserted.role).toBe("USER");
  });

  it("normalizes email to trimmed lowercase", async () => {
    await POST(registerRequest({ ...validBody, email: "  Siti@Example.COM  " }));
    const inserted = insertOne.mock.calls[0]?.[0] as { email: string };

    expect(inserted.email).toBe("siti@example.com");
    expect(findOne).toHaveBeenCalledWith({ email: "siti@example.com" }, expect.anything());
  });

  it("rejects invalid bodies with 400 and does not insert", async () => {
    const cases: unknown[] = [
      {},
      { name: "", email: "siti@example.com", password: validBody.password },
      { name: "Siti", email: "not-an-email", password: validBody.password },
      { name: "Siti", email: "siti@example.com", password: "short" },
      { name: "Siti", email: "siti@example.com" },
      "not json",
    ];

    for (const body of cases) {
      const res = await POST(registerRequest(body));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBeTruthy();
    }
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("rejects duplicate email with 409 (pre-check)", async () => {
    findOne.mockResolvedValue({ _id: "existing" });
    const res = await POST(registerRequest(validBody));

    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("EMAIL_TAKEN");
    expect(insertOne).not.toHaveBeenCalled();
  });

  it("rejects duplicate email with 409 when the unique index wins the race", async () => {
    insertOne.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    const res = await POST(registerRequest(validBody));

    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("EMAIL_TAKEN");
  });

  it("returns a generic 500 without leaking internals on unexpected DB errors", async () => {
    insertOne.mockRejectedValue(new Error("mongodb+srv://user:secret@cluster boom"));
    const res = await POST(registerRequest(validBody));
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("mongodb+srv");
    expect(JSON.parse(text).error.code).toBe("INTERNAL_ERROR");
  });

  it("sets Cache-Control no-store", async () => {
    const res = await POST(registerRequest(validBody));
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
