import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const VALID_ENV = {
  MONGODB_URI: "mongodb+srv://user:pass@cluster.example.net/smartfarm",
  MONGODB_DB_NAME: "smartfarm_iot",
  AUTH_SECRET: "a".repeat(32),
};

describe("parseEnv", () => {
  it("returns the parsed environment with a default AUTH_URL", () => {
    const env = parseEnv(VALID_ENV);

    expect(env.MONGODB_DB_NAME).toBe("smartfarm_iot");
    expect(env.AUTH_URL).toBe("http://localhost:3000");
  });

  it("keeps optional ADMIN_EMAIL and CRON_SECRET when provided", () => {
    const env = parseEnv({
      ...VALID_ENV,
      ADMIN_EMAIL: "admin@example.com",
      CRON_SECRET: "c".repeat(32),
    });

    expect(env.ADMIN_EMAIL).toBe("admin@example.com");
    expect(env.CRON_SECRET).toHaveLength(32);
  });

  it("throws a descriptive error naming every missing variable", () => {
    expect(() => parseEnv({})).toThrowError(/MONGODB_URI is required/);
    expect(() => parseEnv({})).toThrowError(/MONGODB_DB_NAME/);
    expect(() => parseEnv({})).toThrowError(/AUTH_SECRET is required/);
  });

  it("rejects an AUTH_SECRET shorter than 32 characters", () => {
    expect(() => parseEnv({ ...VALID_ENV, AUTH_SECRET: "too-short" })).toThrowError(
      /AUTH_SECRET must be at least 32 characters/,
    );
  });

  it("rejects a MONGODB_URI without the mongodb scheme", () => {
    expect(() =>
      parseEnv({ ...VALID_ENV, MONGODB_URI: "https://cluster.example.net" }),
    ).toThrowError(/MONGODB_URI must start with mongodb:\/\/ or mongodb\+srv:\/\//);
  });

  it("rejects an invalid ADMIN_EMAIL", () => {
    expect(() => parseEnv({ ...VALID_ENV, ADMIN_EMAIL: "not-an-email" })).toThrowError(
      /ADMIN_EMAIL must be a valid email/,
    );
  });

  it("does not echo secret values in the error message", () => {
    const secret = "super-secret-value-that-must-not-leak";

    try {
      parseEnv({ ...VALID_ENV, AUTH_SECRET: secret });
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
