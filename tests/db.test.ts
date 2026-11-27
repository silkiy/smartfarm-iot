import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(async (): Promise<void> => undefined),
  close: vi.fn(async (): Promise<void> => undefined),
  db: vi.fn((name: string) => ({ databaseName: name })),
  constructor: vi.fn(),
}));

vi.mock("mongodb", () => ({
  MongoClient: class {
    constructor(uri: string, options: unknown) {
      mocks.constructor(uri, options);
    }

    async connect() {
      await mocks.connect();
      return this;
    }

    close = mocks.close;
    db = mocks.db;
  },
}));

const CLIENT_PROMISE_KEY = "_smartfarmMongoClientPromise";

function clearCachedClient(): void {
  Reflect.deleteProperty(globalThis, CLIENT_PROMISE_KEY);
}

async function loadDbModule() {
  vi.resetModules();
  return import("@/lib/db");
}

beforeEach(() => {
  vi.stubEnv("MONGODB_URI", "mongodb+srv://user:pass@cluster.example.net/smartfarm");
  vi.stubEnv("MONGODB_DB_NAME", "smartfarm_test");
  vi.stubEnv("AUTH_SECRET", "a".repeat(32));

  clearCachedClient();
  mocks.connect.mockClear();
  mocks.close.mockClear();
  mocks.db.mockClear();
  mocks.constructor.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  clearCachedClient();
});

describe("getDb", () => {
  it("creates one MongoClient and reuses it across calls", async () => {
    const { getDb } = await loadDbModule();

    await getDb();
    await getDb();

    expect(mocks.constructor).toHaveBeenCalledTimes(1);
    expect(mocks.connect).toHaveBeenCalledTimes(1);
    expect(mocks.db).toHaveBeenCalledTimes(2);
    expect(mocks.db).toHaveBeenCalledWith("smartfarm_test");
  });

  it("configures a server selection timeout so a dead cluster fails fast", async () => {
    const { getDb } = await loadDbModule();

    await getDb();

    expect(mocks.constructor).toHaveBeenCalledWith(
      "mongodb+srv://user:pass@cluster.example.net/smartfarm",
      expect.objectContaining({ serverSelectionTimeoutMS: 10_000 }),
    );
  });

  it("retries on the next call after a failed connection", async () => {
    mocks.connect.mockRejectedValueOnce(new Error("cluster unreachable"));
    const { getDb } = await loadDbModule();

    await expect(getDb()).rejects.toThrow("cluster unreachable");
    await expect(getDb()).resolves.toMatchObject({ databaseName: "smartfarm_test" });

    expect(mocks.constructor).toHaveBeenCalledTimes(2);
  });

  it("closeMongoClient closes the cached client and allows a fresh one", async () => {
    const { closeMongoClient, getDb } = await loadDbModule();

    await getDb();
    await closeMongoClient();
    expect(mocks.close).toHaveBeenCalledTimes(1);

    await getDb();
    expect(mocks.constructor).toHaveBeenCalledTimes(2);
  });
});
