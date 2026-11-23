import { MongoClient, ObjectId } from "mongodb";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { readAccounts } from "./global-setup";
import { login } from "./helpers";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3120";
async function resources(): Promise<{
  farmId: string;
  zoneId: string;
}> {
  return JSON.parse(await readFile("test-results/resources.json", "utf8"));
}
const errors = new WeakMap<object, string[]>();
test.beforeEach(({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (e) => list.push(e.message));
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("public root redirects before render and protected pages require login", async ({
  page,
  request,
}) => {
  const response = await request.get("/?from=bookmark", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/dashboard?from=bookmark");
  expect(await response.text()).not.toContain("NEXT_REDIRECT");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.get("/api/workspace")).status()).toBe(401);
});

test("login shows invalid credentials and accessible help", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Bantuan masuk" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Alamat email").fill("missing@example.invalid");
  await page.getByPlaceholder("Minimal 9 karakter").fill("invalid-password");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "tidak valid",
  );
});

test("API authorization isolates owners from other owners", async ({
  playwright,
}) => {
  const { farmId, zoneId } = await resources();
  const contexts = [];
  try {
    for (const index of [1, 2]) {
      const ctx = await playwright.request.newContext({
        baseURL: base,
        extraHTTPHeaders: { Origin: base },
      });
      await login(ctx, index);
      contexts.push(ctx);
    }
    const [owner, other] = contexts;
    expect((await other.delete(`/api/farms/${farmId}`)).status()).toBe(403);
    expect(
      (
        await other.patch(`/api/zones/${zoneId}`, { data: { name: "Hijack" } })
      ).status(),
    ).toBe(403);
    // Owners cannot access the users list — only admins can
    expect((await owner.get("/api/users")).status()).toBe(403);
    expect((await owner.post("/api/users", { data: {} })).status()).toBe(403);
    expect(
      (
        await owner.post("/api/farms", {
          data: {
            name: "X",
            location: "X",
            areaM2: 1,
            phase: "Vegetatif",
            ownerUserId: (await readAccounts())[2].userId,
          },
        })
      ).status(),
    ).toBe(422);
    expect(
      (
        await owner.put(`/api/zones/${zoneId}/rule`, {
          data: {
            enabled: true,
            phase: "Vegetatif",
            threshold: 35,
            target: 8,
            schedule: "06:30",
          },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await owner.post("/api/farms", {
          headers: { Origin: "https://evil.example" },
          data: {},
        })
      ).status(),
    ).toBe(403);
  } finally {
    await Promise.all(contexts.map((c) => c.dispose()));
  }
});

test("alert read state is persisted separately per account", async ({
  playwright,
}) => {
  const contexts = [];
  try {
    for (const i of [1, 2]) {
      const ctx = await playwright.request.newContext({
        baseURL: base,
        extraHTTPHeaders: { Origin: base },
      });
      await login(ctx, i);
      contexts.push(ctx);
    }
    const [owner1, owner2] = contexts;
    const notice = (await (await owner1.get("/api/workspace")).json()).data
      .notices[0];
    expect(notice).toBeTruthy();
    expect(
      (
        await owner1.patch("/api/notifications/read", {
          data: { ids: [notice.id] },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await (await owner1.get("/api/workspace")).json()).data.notices[0].read,
    ).toBe(true);
    expect(
      (await (await owner2.get("/api/workspace")).json()).data.notices[0]?.read,
    ).not.toBe(true);
  } finally {
    await Promise.all(contexts.map((c) => c.dispose()));
  }
});

test.describe("authenticated application", () => {
  test.beforeEach(async ({ request, context }) => {
    await login(request, 0);
    await context.addCookies((await request.storageState()).cookies);
  });
  const headings: Record<string, string> = {
    dashboard: "Dashboard lahan",
    irigasi: "Kontrol irigasi",
    analisis: "Grafik & laporan",
    notifikasi: "Notifikasi",
    lahan: "Lahan & sensor",
    pengguna: "Pengguna",
  };
  for (const width of [320, 375, 768, 1024, 1440, 1920, 2560])
    for (const route of ["login", ...Object.keys(headings)])
      test(`${route} fits ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        expect((await page.goto(`/${route}`))?.status()).toBe(200);
        if (route !== "login")
          await expect(
            page.getByRole("heading", { name: headings[route], exact: true }),
          ).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
      });

  test("profile actions keep space and Escape restores keyboard focus", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const trigger = page.getByRole("button", {
      name: "Buka profil",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Profil akun" });
    const manage = await dialog
      .getByRole("link", { name: "Pengguna & penugasan", exact: true })
      .boundingBox();
    const logout = await dialog
      .getByRole("button", { name: "Keluar dari akun", exact: true })
      .boundingBox();
    expect(logout!.y - manage!.y - manage!.height).toBeGreaterThanOrEqual(8);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("farm and zone CRUD survives reload and rules persist", async ({
    page,
  }) => {
    const name = `Lahan ${randomUUID().slice(0, 8)}`;
    await page.goto("/lahan");
    await page
      .getByRole("button", { name: "Tambah lahan", exact: true })
      .first()
      .click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama lahan").fill(name);
    await dialog.getByLabel("Lokasi", { exact: true }).fill("Lamongan");
    await dialog.getByLabel("Luas lahan (m²)").fill("1250");
    await dialog.getByRole("button", { name: "Simpan lahan" }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    const card = page
      .getByTestId("farm-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Tambah zona" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama zona").fill("Petak baru");
    await dialog.getByRole("button", { name: "Simpan zona" }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(card.getByText("Petak baru", { exact: true })).toBeVisible();
    await card
      .getByRole("button", { name: /Pilih lahan|Lahan terpilih/ })
      .click();
    await page.goto("/irigasi");
    await page.getByLabel("Pilih lahan").selectOption({ label: name });
    await expect(
      page.getByRole("button", { name: "Mulai irigasi", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Aturan otomatis", exact: true })
      .click();
    await page.getByLabel(/^Ambang kelembapan/).fill("32");
    await page
      .getByRole("button", { name: "Simpan aturan", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Perubahan disimpan");
    await page.reload();
    await page.getByLabel("Pilih lahan").selectOption({ label: name });
    await page
      .getByRole("button", { name: "Aturan otomatis", exact: true })
      .click();
    await expect(page.getByLabel(/^Ambang kelembapan/)).toHaveValue("32");
    await page.goto("/lahan");
    await page
      .getByRole("button", { name: `Hapus ${name}`, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus lahan", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0,
    );
  });

  test("notification preferences survive reload and hardware is absent", async ({
    page,
  }) => {
    await page.goto("/notifikasi");
    const control = page.getByRole("switch", { name: "Preferensi WhatsApp" });
    await expect(control).toBeVisible();
    const previous = await control.getAttribute("aria-checked");
    await control.click();
    await expect(control).toHaveAttribute(
      "aria-checked",
      previous === "true" ? "false" : "true",
    );
    await page.reload();
    await expect(control).toHaveAttribute(
      "aria-checked",
      previous === "true" ? "false" : "true",
    );
    await expect(
      page.getByRole("button", { name: "Kirim pesan uji" }),
    ).toBeDisabled();
    await page.goto("/analisis");
    await expect(
      page.getByRole("heading", { name: "Belum ada pembacaan sensor" }),
    ).toBeVisible();
  });

  test("admin creates a landowner account and deactivation invalidates the session", async ({
    request,
    playwright,
  }) => {
    const email = `${randomUUID()}@example.invalid`,
      password = randomUUID().slice(0, 9);
    const rejected = await request.post("/api/users", {
      headers: { Origin: base },
      data: {
        email,
        password: password.slice(0, 8),
        displayName: "Pemilik pengujian",
        role: "LANDOWNER",
      },
    });
    expect(rejected.status()).toBe(422);
    const response = await request.post("/api/users", {
      headers: { Origin: base },
      data: {
        email,
        password,
        displayName: "Pemilik pengujian",
        role: "LANDOWNER",
      },
    });
    expect(response.status()).toBe(201);
    const id = (await response.json()).data.id;
    const accounts = await readAccounts();
    accounts.push({ userId: id, email, password, role: "LANDOWNER" });
    await writeFile("test-results/accounts.json", JSON.stringify(accounts));
    const ctx = await playwright.request.newContext({
      baseURL: base,
      extraHTTPHeaders: { Origin: base },
    });
    try {
      await login(ctx, accounts.length - 1);
      expect(
        (
          await request.patch(`/api/users/${id}`, {
            headers: { Origin: base },
            data: { isActive: false },
          })
        ).status(),
      ).toBe(200);
      expect((await ctx.get("/api/workspace")).status()).toBe(401);
      expect(
        (
          await request.patch(`/api/users/${id}`, {
            headers: { Origin: base },
            data: { isActive: true },
          })
        ).status(),
      ).toBe(200);
      expect((await ctx.get("/api/workspace")).status()).toBe(401);
    } finally {
      await ctx.dispose();
    }
  });

  test("password reset revokes an existing session and new credentials can sign in", async ({
    request,
    playwright,
  }) => {
    const email = `${randomUUID()}@example.invalid`,
      password = randomUUID() + "Aa!";
    const response = await request.post("/api/users", {
      headers: { Origin: base },
      data: {
        email,
        password,
        displayName: "Reset audit",
        role: "LANDOWNER",
      },
    });
    expect(response.status()).toBe(201);
    const id = (await response.json()).data.id;
    const accounts = await readAccounts();
    accounts.push({ userId: id, email, password, role: "LANDOWNER" });
    await writeFile("test-results/accounts.json", JSON.stringify(accounts));
    const ctx = await playwright.request.newContext({
      baseURL: base,
      extraHTTPHeaders: { Origin: base },
    });
    const fresh = await playwright.request.newContext({
      baseURL: base,
      extraHTTPHeaders: { Origin: base },
    });
    try {
      await login(ctx, accounts.length - 1);
      const nextPassword = randomUUID().slice(0, 9);
      expect(
        (
          await request.patch(`/api/users/${id}`, {
            headers: { Origin: base },
            data: { password: nextPassword.slice(0, 8) },
          })
        ).status(),
      ).toBe(422);
      expect((await ctx.get("/api/workspace")).status()).toBe(200);
      expect(
        (
          await request.patch(`/api/users/${id}`, {
            headers: { Origin: base },
            data: { password: nextPassword },
          })
        ).status(),
      ).toBe(200);
      expect((await ctx.get("/api/workspace")).status()).toBe(401);
      accounts[accounts.length - 1].password = nextPassword;
      await writeFile("test-results/accounts.json", JSON.stringify(accounts));
      await login(fresh, accounts.length - 1);
      expect((await fresh.get("/api/workspace")).status()).toBe(200);
    } finally {
      await ctx.dispose();
      await fresh.dispose();
    }
  });

  test("list endpoints reject invalid page numbers", async ({ request }) => {
    for (const path of ["/api/users", "/api/farms"]) {
      for (const page of ["Infinity", "1.5", "-1", "abc", "100001"]) {
        expect((await request.get(`${path}?page=${page}`)).status()).toBe(422);
      }
    }
  });

  test("farm edits and ownership transfer enforce current access", async ({
    request,
    playwright,
  }) => {
    const accounts = await readAccounts();
    const contexts: APIRequestContext[] = [];
    try {
      for (const index of [1, 2]) {
        const ctx = await playwright.request.newContext({
          baseURL: base,
          extraHTTPHeaders: { Origin: base },
        });
        await login(ctx, index);
        contexts.push(ctx);
      }
      const [owner, other] = contexts;
      const fields = {
        name: "Transfer audit",
        location: "Lamongan",
        areaM2: 1200,
        phase: "Vegetatif",
      };
      const created = await owner.post("/api/farms", { data: fields });
      expect(created.status()).toBe(201);
      const farmId = (await created.json()).data.id;
      const createdZone = await owner.post(`/api/farms/${farmId}/zones`, {
        data: { name: "Zona audit" },
      });
      expect(createdZone.status()).toBe(201);
      const zoneId = (await createdZone.json()).data.id;
      expect(
        (
          await owner.patch(`/api/farms/${farmId}`, {
            data: { ...fields, areaM2: 2400, phase: "Generatif" },
          })
        ).status(),
      ).toBe(200);
      expect(
        (
          await owner.patch(`/api/zones/${zoneId}`, {
            data: { name: "Zona diperbarui" },
          })
        ).status(),
      ).toBe(200);
      const state = (await (await owner.get("/api/workspace")).json()).data;
      expect(
        state.farms.find((f: { id: string }) => f.id === farmId).phase,
      ).toBe("Generatif");
      expect(
        state.zones.find((z: { id: string }) => z.id === zoneId).name,
      ).toBe("Zona diperbarui");
      expect(
        (
          await request.put(`/api/farms/${farmId}/owner`, {
            headers: { Origin: base },
            data: { ownerUserId: accounts[2].userId },
          })
        ).status(),
      ).toBe(200);
      expect(
        (await owner.patch(`/api/farms/${farmId}`, { data: fields })).status(),
      ).toBe(403);
      expect(
        (await other.patch(`/api/farms/${farmId}`, { data: fields })).status(),
      ).toBe(200);
      expect((await other.delete(`/api/zones/${zoneId}`)).status()).toBe(200);
      expect(
        (
          await other.patch(`/api/zones/${zoneId}`, {
            data: { name: "Revive" },
          })
        ).status(),
      ).toBe(404);
      expect((await other.delete(`/api/farms/${farmId}`)).status()).toBe(200);
      expect(
        (
          await other.post(`/api/farms/${farmId}/zones`, {
            data: { name: "Revive" },
          })
        ).status(),
      ).toBe(404);
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.dispose()));
    }
  });

  test("API rejects malformed requests and provider tests remain disabled", async ({
    request,
  }) => {
    expect(
      (
        await request.post("/api/farms", {
          headers: { Origin: base, "Content-Type": "application/json" },
          data: Buffer.from("{"),
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post("/api/farms", {
          headers: { Origin: base, "Content-Type": "text/plain" },
          data: "{}",
        })
      ).status(),
    ).toBe(415);
    expect(
      (
        await request.post("/api/farms", {
          headers: { Origin: base, "Content-Type": "application/json" },
          data: JSON.stringify({ name: "a".repeat(17000) }),
        })
      ).status(),
    ).toBe(413);
    expect(
      (
        await request.delete("/api/farms/not-an-id", {
          headers: { Origin: base },
        })
      ).status(),
    ).toBe(400);
    const readiness = (await (await request.get("/api/integrations")).json())
      .data;
    expect(readiness.whatsappReady).toBe(false);
    expect(
      (
        await request.post("/api/integrations/whatsapp/test", {
          headers: { Origin: base },
          data: { requestId: randomUUID() },
        })
      ).status(),
    ).toBe(503);
    const { farmId } = await resources();
    expect((await request.get(`/api/farms/${farmId}/weather`)).status()).toBe(
      503,
    );
    const cookie = (await request.storageState()).cookies.find((c) =>
      c.name.includes("session-token"),
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  });

  test("reports and dashboard use existing database measurements without device execution", async ({
    request,
    page,
  }) => {
    const { farmId, zoneId } = await resources();
    const client = new MongoClient(process.env.TEST_MONGODB_URI!);
    await client.connect();
    try {
      await client.db().collection("sensor_readings").insertOne({
        deviceId: "test-fixture-only",
        farmId,
        zoneId,
        soilMoisture: 69,
        waterLevelCm: 6.5,
        pumpStatus: "OFF",
        valveStatus: "CLOSED",
        measuredAt: new Date(),
        requestId: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const date = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      const response = await request.get(
        `/api/reports?farmId=${farmId}&from=${date}&to=${date}`,
      );
      expect(response.status()).toBe(200);
      const report = (await response.json()).data;
      expect(report.readings[0].moisture).toBe(69);
      expect(report.readings[0].water).toBe(6.5);
      await page.goto("/analisis");
      await page.getByLabel("Pilih lahan").selectOption(farmId);
      await expect(
        page.getByRole("img", { name: /Grafik pembacaan/ }),
      ).toBeVisible();
      expect(
        (await page
          .getByRole("img", { name: /Grafik pembacaan/ })
          .boundingBox())!.height,
      ).toBeLessThanOrEqual(320);
      await expect(page.getByTestId("chart-point")).toHaveCount(1);
      await expect(page.getByTestId("chart-area")).toHaveCount(0);
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Unduh CSV", exact: true })
        .click();
      const download = await downloadPromise;
      const file = await download.path();
      const csv = await readFile(file!, "utf8");
      expect(csv).toContain('"TERSIMPAN"');
      expect(csv).toContain('"69","6.5"');
      await page.goto("/dashboard");
      await page.getByLabel("Pilih lahan").selectOption(farmId);
      await expect(
        page.getByRole("heading", { name: "Dashboard lahan" }),
      ).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Infinity");
      await expect(page.locator("body")).not.toContainText("NaN");
      expect(
        await client
          .db()
          .collection("device_commands")
          .countDocuments({ farmId: new ObjectId(farmId) }),
      ).toBe(0);
    } finally {
      await client.close();
    }
  });

  test("successful user creation is not reported as failed when list refresh fails", async ({
    page,
  }) => {
    await page.goto("/pengguna");
    await expect(
      page.getByRole("heading", { name: "Daftar pengguna", exact: true }),
    ).toBeVisible();
    const email = `${randomUUID()}@example.invalid`,
      password = randomUUID() + "Aa!";
    await page
      .getByLabel("Nama pengguna", { exact: true })
      .fill("Refresh audit");
    await page.getByLabel("Email pengguna", { exact: true }).fill(email);
    await page.getByLabel(/^Kata sandi awal/).fill(password);
    await page.route("**/api/users?*", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Daftar gagal dimuat" } }),
      }),
    );
    const responsePromise = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/users" &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Simpan akun", exact: true })
      .click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const id = (await response.json()).data.id;
    const accounts = await readAccounts();
    accounts.push({ userId: id, email, password, role: "LANDOWNER" });
    await writeFile("test-results/accounts.json", JSON.stringify(accounts));
    await expect(
      page.getByLabel("Email pengguna", { exact: true }),
    ).toHaveValue("");
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "tersimpan",
    );
  });

  test("logout revokes browser session", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: "Buka profil", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Keluar dari akun", exact: true })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
