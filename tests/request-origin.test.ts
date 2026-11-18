import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOrigin } from "../src/server/http/origin";
test("matches the requested Host when Next uses an internal localhost URL", () => {
  const request = new Request("http://localhost:3130/api/farms", {
    headers: { Host: "127.0.0.1:3130", Origin: "http://127.0.0.1:3130" },
  });
  assert.equal(isSameOrigin(request), true);
});
test("rejects cross-origin, absent Origin, and forged forwarded-host", () => {
  assert.equal(
    isSameOrigin(
      new Request("http://localhost/api/farms", {
        headers: {
          Host: "localhost",
          Origin: "https://evil.example",
          "X-Forwarded-Host": "evil.example",
        },
      }),
    ),
    false,
  );
  assert.equal(isSameOrigin(new Request("http://localhost/api/farms")), false);
});
test("pins the configured public origin behind a reverse proxy", () => {
  const request = new Request("http://internal/api/farms", {
    headers: { Host: "internal", Origin: "https://farm.example" },
  });
  assert.equal(isSameOrigin(request, "https://farm.example"), true);
});
