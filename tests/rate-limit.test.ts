import { beforeEach, describe, expect, it } from "vitest";
import { clientKey, rateLimit, resetRateLimitStore } from "@/lib/rate-limit";

beforeEach(() => {
  resetRateLimitStore();
});

describe("rateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    const now = 1_000;
    expect(rateLimit("k", 2, 1000, now).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, now + 1).allowed).toBe(true);
  });

  it("blocks after the limit and reports Retry-After seconds", () => {
    const now = 1_000;
    rateLimit("k", 1, 1000, now);
    const blocked = rateLimit("k", 1, 1000, now + 500);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("resets after the window passes", () => {
    const now = 1_000;
    rateLimit("k", 1, 1000, now);
    expect(rateLimit("k", 1, 1000, now + 1001).allowed).toBe(true);
  });

  it("keys are independent", () => {
    const now = 1_000;
    rateLimit("a", 1, 1000, now);
    expect(rateLimit("b", 1, 1000, now).allowed).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for entry with a scope", () => {
    const req = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req, "register")).toBe("register:1.2.3.4");
  });

  it("falls back to unknown", () => {
    expect(clientKey(new Request("http://localhost"), "register")).toBe("register:unknown");
  });
});
