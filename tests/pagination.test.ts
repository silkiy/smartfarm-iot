import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePage } from "../src/domain/pagination";
test("pagination accepts bounded positive integer pages", () => {
  assert.equal(parsePage(new URLSearchParams()), 1);
  assert.equal(parsePage(new URLSearchParams("page=100000")), 100000);
  for (const value of [
    "",
    "0",
    "-1",
    "1.5",
    "Infinity",
    "NaN",
    "abc",
    "100001",
  ]) {
    assert.throws(() => parsePage(new URLSearchParams({ page: value })));
  }
  assert.throws(() => parsePage(new URLSearchParams("page=1&page=2")));
});
