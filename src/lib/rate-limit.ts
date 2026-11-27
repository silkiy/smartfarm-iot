/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Best effort: state is per process. On Vercel serverless, separate instances
 * do not share this store, so a durable/shared limiter (e.g. Redis/Upstash or
 * platform rate limiting) is required for a hard guarantee. AGENT.md §12.4.
 */

type Window = number[]; // request timestamps (ms), oldest first

const store = new Map<string, Window>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  store.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Derive a best-effort client key. `x-forwarded-for` is trusted only behind a known proxy (e.g. Vercel). */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? (forwarded.split(",")[0] ?? "").trim() : "";
  return `${scope}:${ip || request.headers.get("x-real-ip") || "unknown"}`;
}

/** Test helper; not used in production request paths. */
export function resetRateLimitStore(): void {
  store.clear();
}
