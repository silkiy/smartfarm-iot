import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchWeather } from "../src/server/integrations/weather";
import { requestJson, RequestError } from "../src/lib/api-client";
test("invalid provider data is a weather failure, not a user validation error", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ current: { temperature_2m: "wrong" } }),
  );
  await assert.rejects(() => fetchWeather(-7, 112), {
    name: "WeatherProviderError",
  });
});
test("non-JSON server failures produce a usable error without leaking HTML", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>upstream failure</html>", { status: 502 }),
  );
  await assert.rejects(
    () => requestJson("/api/workspace"),
    (error: unknown) =>
      error instanceof RequestError &&
      error.status === 502 &&
      !error.message.includes("<html>"),
  );
});
