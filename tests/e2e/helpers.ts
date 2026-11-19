import { expect, type APIRequestContext } from "@playwright/test";
import { readAccounts } from "./global-setup";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3120";
export async function login(request: APIRequestContext, index: number) {
  const account = (await readAccounts())[index];
  const { csrfToken } = await (await request.get("/api/auth/csrf")).json();
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, email: account.email, password: account.password },
    headers: { Origin: base, "X-Auth-Return-Redirect": "1" },
  });
  expect((await (await request.get("/api/auth/session")).json()).user?.id).toBe(
    account.userId,
  );
}
