import assert from "node:assert/strict";
import { test } from "node:test";
import { credentialsSchema } from "../src/domain/users";
import { userInputSchema } from "../src/domain/workspace";

test("login and account creation accept nine characters and reject eight", () => {
  for (const password of ["12345678", "123456789"]) {
    const expected = password.length >= 9;
    assert.equal(
      credentialsSchema.safeParse({ email: "user@example.invalid", password })
        .success,
      expected,
    );
    assert.equal(
      userInputSchema.safeParse({
        email: "user@example.invalid",
        displayName: "User",
        password,
        role: "LANDOWNER",
      }).success,
      expected,
    );
  }
});
test("bcrypt's maximum byte length remains enforced", () => {
  assert.equal(
    credentialsSchema.safeParse({
      email: "user@example.invalid",
      password: "a".repeat(73),
    }).success,
    false,
  );
  assert.equal(
    userInputSchema.safeParse({
      email: "user@example.invalid",
      displayName: "User",
      password: "é".repeat(37),
      role: "ADMIN",
    }).success,
    false,
  );
});
