/**
 * Checkpoint 2 end-to-end verification against a SCRATCH database.
 *
 * Safety:
 *  - Uses MONGODB_URI from .env, but FORCES a separate scratch db name
 *    (`cp2_scratch`) for the app child AND for cleanup.
 *  - Never touches `smartfarm_iot` / `smartfarm-iot`.
 *  - Asserts db.databaseName === SCRATCH_DB before any write or drop.
 *  - Creates one throwaway user, then DROPS the scratch database.
 *  - Reads no production data. Prints no secrets.
 *
 * Run: npx tsx scripts/verify-checkpoint2.mts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const SCRATCH_DB = "cp2_scratch";
const PROD_DB_NAMES = new Set(["smartfarm_iot", "smartfarm-iot", "smartfarm"]);
const PORT = 3000;
const BASE = `http://localhost:${PORT}`;

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing (from .env); refusing to run.");
if (PROD_DB_NAMES.has(SCRATCH_DB)) throw new Error("scratch db name collides with production");

type Jar = { cookie: string };

function mergeSetCookies(jar: Jar, res: Response): Jar {
  const setCookies = res.headers.getSetCookie();
  const store = new Map<string, string>(jar.cookie.split("; ").filter(Boolean).map((c) => {
    const i = c.indexOf("=");
    return [c.slice(0, i), c.slice(i + 1)] as const;
  }));
  for (const sc of setCookies) {
    const pair = sc.split(";")[0] ?? "";
    const i = pair.indexOf("=");
    if (i <= 0) continue;
    store.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return { cookie: [...store].map(([k, v]) => `${k}=${v}`).join("; ") };
}

async function waitForServer(url: string, timeoutMs = 20_000): Promise<void> {
  const start = Date.now();
  let lastError: unknown;
  for (;;) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status >= 200 && r.status < 500) return;
    } catch (error) {
      lastError = error; // not swallowed; re-thrown on timeout below
    }
    if (Date.now() - start > timeoutMs) throw new Error("server did not start", { cause: lastError });
    await delay(500);
  }
}

let child: ChildProcess | undefined;
const results: Array<[string, boolean, string]> = [];
function check(name: string, ok: boolean, detail = "") {
  results.push([name, ok, detail]);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` :: ${detail}` : ""}`);
}

async function main(): Promise<void> {
  // ---- scratch DB: connect + assert name + create unique index on scratch ----
  const client = new MongoClient(MONGODB_URI!, { serverSelectionTimeoutMS: 8_000, connectTimeoutMS: 8_000, socketTimeoutMS: 15_000 });
  console.log("step: connecting scratch MongoDB..."); await Promise.race([client.connect(), delay(10_000).then(() => { throw new Error("scratch MongoDB connect timeout"); })]);
  const scratch = client.db(SCRATCH_DB);
  if (scratch.databaseName !== SCRATCH_DB || PROD_DB_NAMES.has(scratch.databaseName)) {
    throw new Error("refusing to operate on non-scratch database");
  }
  await scratch.collection("users").createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });

  // ---- start app against scratch db ----
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, MONGODB_DB_NAME: SCRATCH_DB, AUTH_URL: BASE, NODE_ENV: "production" },
    stdio: "ignore",
  });

  try {
    console.log("step: waiting for next start..."); await waitForServer(`${BASE}/api/auth/csrf`); console.log("step: server ready");

    // ---------- CP2 item 2: /register -> /login -> /dashboard ----------
    const email = `cp2.${Date.now()}@example.test`.toLowerCase();
    const password = "rahasia-kuat-123";
    const name = "CP2 Test";

    // register (attempt role ADMIN injection; must be ignored)
    let jar: Jar = { cookie: "" };
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "ADMIN" }),
    });
    jar = mergeSetCookies(jar, regRes);
    const regJson = (await regRes.json()) as { ok: boolean; data?: { role?: string; passwordHash?: string }; error?: unknown };
    check("register 201", regRes.status === 201, `status=${regRes.status}`);
    check("register role USER (client role ignored)", regJson.data?.role === "USER", `role=${regJson.data?.role}`);
    check("register no passwordHash in response", regJson.data?.passwordHash === undefined);

    // registered /login page reachable before login
    const loginPage = await fetch(`${BASE}/login`, { redirect: "manual" });
    check("GET /login 200", loginPage.status === 200);

    // CSRF + credentials login
    const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { headers: { cookie: jar.cookie } });
    jar = mergeSetCookies(jar, csrfRes);
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

    const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.cookie },
      body: new URLSearchParams({ email, password, csrfToken, redirect: "false" }).toString(),
      redirect: "manual",
    });
    jar = mergeSetCookies(jar, loginRes);
    check("credentials login accepted", loginRes.status === 200 || loginRes.status === 302, `status=${loginRes.status}`);
    const sc = loginRes.headers.getSetCookie();
    console.log("set-cookie-attrs:", JSON.stringify(sc.map((c) => { const [nv, ...a] = c.split(";").map((x) => x.trim()); return { name: nv.split("=")[0], attrs: a }; })));

    // session has id + role
    const sessionRes = await fetch(`${BASE}/api/auth/session`, { headers: { cookie: jar.cookie } });
    const session = (await sessionRes.json()) as { user?: { id?: string; role?: string; email?: string } };
    check("session user.id present", typeof session.user?.id === "string" && session.user.id.length > 0);
    check("session user.role USER", session.user?.role === "USER", `role=${session.user?.role}`);
    check("session email", session.user?.email === email);

    // /dashboard with session -> 200 (not redirect); anon -> 307 /login; /login with session -> /dashboard
    const dashAuth = await fetch(`${BASE}/dashboard`, { headers: { cookie: jar.cookie }, redirect: "manual" });
    check("/dashboard authenticated not redirected", dashAuth.status === 200, `status=${dashAuth.status}`);

    const dashAnon = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
    check("/dashboard anonymous -> /login", dashAnon.status === 307 && (dashAnon.headers.get("location") ?? "").includes("/login"), `status=${dashAnon.status} loc=${dashAnon.headers.get("location")}`);

    const loginAuth = await fetch(`${BASE}/login`, { headers: { cookie: jar.cookie }, redirect: "manual" });
    check("/login authenticated -> /dashboard", loginAuth.status === 307 && (loginAuth.headers.get("location") ?? "").includes("/dashboard"), `status=${loginAuth.status} loc=${loginAuth.headers.get("location")}`);

    // wrong password -> generic failure, no session
    const badLogin = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.cookie },
      body: new URLSearchParams({ email, password: "salah", csrfToken, redirect: "false" }).toString(),
      redirect: "manual",
    });
    check("wrong password rejected", badLogin.status >= 300, `status=${badLogin.status}`);

    // ---------- scratch `users` document checks (scratch only) ----------
    const doc = await scratch.collection("users").findOne({ email });
    check("scratch users doc created", doc !== null);
    check("stored passwordHash bcrypt", typeof doc?.passwordHash === "string" && /^\$2[aby]\$12\$/.test(doc.passwordHash as string));
    check("stored passwordHash != plain", doc?.passwordHash !== password);
    check("role USER stored", doc?.role === "USER", `role=${String(doc?.role)}`);
    check("email lowercase", doc?.email === email);
    check("createdAt set", doc?.createdAt instanceof Date);

    // duplicate email -> 409
    const dup = await fetch(`${BASE}/api/auth/register`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "ADMIN" }),
    });
    check("duplicate email 409", dup.status === 409, `status=${dup.status}`);
  } finally {
    // ---------- stop app ----------
    if (child && !child.killed) child.kill("SIGTERM");
  }

  // ---------- CP2 cleanup: drop ONLY the scratch db ----------
  if (scratch.databaseName === SCRATCH_DB && !PROD_DB_NAMES.has(scratch.databaseName)) {
    await scratch.dropDatabase();
    const after = await client.db(SCRATCH_DB).listCollections().toArray();
    check("scratch db dropped + cleaned", after.length === 0, `collections=${after.length}`);
  } else {
    check("scratch db dropped + cleaned", false, "refused: name check");
  }
  await client.close();

  const failed = results.filter(([, ok]) => !ok);
  console.log(`\nCP2_RESULT passed=${results.length - failed.length} failed=${failed.length}`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("CP2 e2e failed:", error instanceof Error ? error.message : String(error));
  if (child && !child.killed) child.kill("SIGTERM");
  process.exitCode = 1;
});
