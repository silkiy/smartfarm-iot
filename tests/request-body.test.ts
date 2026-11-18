import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedBody, BodyTooLarge } from "../src/server/http/body";
test("JSON boundary measures actual bytes even without Content-Length", async () => {
  assert.equal(
    await boundedBody(
      new Request("https://farm.example", {
        method: "POST",
        body: '{"ok":true}',
      }),
    ),
    '{"ok":true}',
  );
  await assert.rejects(
    () =>
      boundedBody(
        new Request("https://farm.example", {
          method: "POST",
          body: "é".repeat(9000),
        }),
      ),
    BodyTooLarge,
  );
});
test("oversize declared bodies are rejected before reading", async () => {
  await assert.rejects(
    () =>
      boundedBody(
        new Request("https://farm.example", {
          method: "POST",
          body: "{}",
          headers: { "Content-Length": "999999" },
        }),
      ),
    BodyTooLarge,
  );
});
