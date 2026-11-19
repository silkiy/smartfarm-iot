import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";
import type { WorkspaceSnapshot } from "../../src/features/workspace/types";

const routes = [
  "dashboard",
  "lahan",
  "irigasi",
  "analisis",
  "notifikasi",
  "pengguna",
];
const headings: Record<string, string> = {
  dashboard: "Dashboard lahan",
  lahan: "Lahan & sensor",
  irigasi: "Kontrol irigasi",
  analisis: "Grafik & laporan",
  notifikasi: "Notifikasi",
  pengguna: "Pengguna & penugasan",
};
async function ready(page: Page, route: string, worker = false) {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: route === "pengguna" && worker ? "Akses terbatas" : headings[route],
      exact: true,
    }),
  ).toBeVisible();
}
const failure = { error: { message: "Layanan pengujian belum tersedia." } };
test.beforeEach(async ({ request, context }) => {
  await login(request, 0);
  await context.addCookies((await request.storageState()).cookies);
});

async function fits(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `${new URL(page.url()).pathname} overflows ${page.viewportSize()?.width}px`,
  ).toBe(true);
}
async function dialogFits(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  await dialog
    .locator(".dialog-body")
    .evaluate((e) => (e.scrollTop = e.scrollHeight));
  const close = await dialog
    .getByRole("button", { name: "Tutup dialog" })
    .boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(0);
  for (const button of await dialog.locator(".dialog-footer button").all()) {
    const box = await button.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  }
}

for (const [index, role] of [
  [0, "admin"],
  [1, "owner"],
  [3, "worker"],
] as const)
  for (const width of [320, 768, 1440])
    test(`${role}: every page fits ${width}px and exposes usable actions`, async ({
      page,
      request,
      context,
    }) => {
      await login(request, index);
      await context.addCookies((await request.storageState()).cookies);
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const route of routes) {
        await page.goto(`/${route}`);
        await ready(page, route, role === "worker");
        if (route === "lahan") {
          await expect(
            page.getByRole("button", { name: "Tambah lahan", exact: true }),
          ).toHaveCount(role === "worker" ? 0 : 1);
        }
        if (route === "pengguna") {
          await expect(
            page.getByRole("heading", { name: "Tambah akun", exact: true }),
          ).toHaveCount(role === "admin" ? 1 : 0);
        }
        if (route === "irigasi") {
          await page
            .getByRole("button", { name: "Aturan otomatis", exact: true })
            .click();
          const control = page.getByRole("switch", {
            name: "Aktifkan aturan otomatis",
          });
          if (role === "worker") await expect(control).toBeDisabled();
          else await expect(control).toBeEnabled();
        }
        await fits(page);
        const small = await page
          .locator("main button:not(:disabled), main select")
          .evaluateAll((elements) =>
            elements.flatMap((e) => {
              const box = e.getBoundingClientRect();
              if (!box.width || !box.height) return [];
              return box.width < 43.5 || box.height < 43.5
                ? [e.getAttribute("aria-label") || e.textContent]
                : [];
            }),
          );
        expect(small).toEqual([]);
        const brandHeights = await page
          .locator("a:has(.brand)")
          .evaluateAll((links) =>
            links
              .map((link) => link.getBoundingClientRect())
              .filter((box) => box.width > 0)
              .map((box) => box.height),
          );
        expect(brandHeights.every((height) => height >= 44)).toBe(true);
      }
      expect(errors).toEqual([]);
    });

for (const viewport of [
  { width: 320, height: 480 },
  { width: 844, height: 390 },
])
  test(`all account and farm dialogs fit ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/lahan");
    await page
      .getByRole("button", { name: "Buka profil", exact: true })
      .click();
    await dialogFits(page);
    await page.keyboard.press("Escape");
    const card = page.getByTestId("farm-card").filter({
      has: page.getByRole("heading", {
        name: "Sawah pengujian",
        exact: true,
      }),
    });
    await expect(card).toBeVisible();
    const actions = [
      page.getByRole("button", { name: "Tambah lahan", exact: true }),
      card.getByRole("button", { name: "Ubah Sawah pengujian", exact: true }),
      card.getByRole("button", { name: "Hapus Sawah pengujian", exact: true }),
      card.getByRole("button", { name: "Tambah zona", exact: true }),
      card.getByRole("button", { name: /^Ubah Zona/ }).first(),
      card.getByRole("button", { name: /^Hapus Zona/ }).first(),
      card.getByRole("button", { name: /^Lihat perangkat/ }).first(),
    ];
    for (const action of actions) {
      await action.click();
      await dialogFits(page);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

test("login help, password visibility, and the missing-page view remain usable on a short screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/login");
  await page.getByPlaceholder("Minimal 9 karakter").fill("test-password");
  await page.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(page.getByPlaceholder("Minimal 9 karakter")).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Bantuan masuk", exact: true })
    .click();
  await dialogFits(page);
  await page.getByRole("button", { name: "Mengerti", exact: true }).click();
  await fits(page);
  await page.goto("/ui-audit-missing-page");
  await expect(
    page.getByRole("heading", { name: "Halaman belum ditemukan" }),
  ).toBeVisible();
  await fits(page);
});

for (const route of routes)
  test(`${route}: empty workspace remains readable on mobile and desktop`, async ({
    page,
    request,
  }) => {
    const snapshot = (await (await request.get("/api/workspace")).json()).data;
    await page.route("**/api/workspace", (r) =>
      r.fulfill({
        json: {
          data: { ...snapshot, farms: [], zones: [], rules: {}, notices: [] },
        },
      }),
    );
    await page.route("**/api/users?*", (r) =>
      r.fulfill({ json: { data: { items: [], total: 0 } } }),
    );
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${route}`);
      await ready(page, route);
      await fits(page);
      await expect(page.locator("main")).not.toContainText("NaN");
      await expect(page.locator("main")).not.toContainText("Infinity");
    }
  });

test("workspace loading and request failure offer a centered recovery flow", async ({
  page,
  request,
}) => {
  const snapshot = (await (await request.get("/api/workspace")).json()).data;
  let release!: () => void;
  const pending = new Promise<void>((r) => (release = r));
  await page.route("**/api/workspace", async (r) => {
    await pending;
    await r.fulfill({ json: { data: snapshot } });
  });
  await page.setViewportSize({ width: 320, height: 480 });
  try {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Menyiapkan ruang kerja" }),
    ).toBeVisible();
    await fits(page);
  } finally {
    release();
  }
  await expect(
    page.getByRole("heading", { name: "Dashboard lahan" }),
  ).toBeVisible();
  await page.unroute("**/api/workspace");
  await page.route("**/api/workspace", (r) =>
    r.fulfill({ status: 503, json: failure }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Data belum dapat dimuat" }),
  ).toBeVisible();
  await fits(page);
  await page.unroute("**/api/workspace");
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard lahan" }),
  ).toBeVisible();
});

test("weather loading, failure and success stay within the dashboard card", async ({
  page,
  request,
}) => {
  const snapshot: WorkspaceSnapshot = (
    await (await request.get("/api/workspace")).json()
  ).data;
  await page.route("**/api/workspace", (r) =>
    r.fulfill({
      json: {
        data: {
          ...snapshot,
          farms: snapshot.farms.map((f) => ({
            ...f,
            latitude: -7.1,
            longitude: 112.4,
          })),
        },
      },
    }),
  );
  await page.setViewportSize({ width: 320, height: 900 });
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/farms/*/weather", async (r) => {
    await gate;
    await r.fulfill({ status: 503, json: failure });
  });
  try {
    await page.goto("/dashboard");
    await expect(
      page.getByText("Memuat cuaca…", { exact: true }),
    ).toBeVisible();
    await fits(page);
  } finally {
    release();
  }
  await expect(page.getByRole("main")).toContainText(failure.error.message);
  await page.unroute("**/api/farms/*/weather");
  for (const success of [true]) {
    await page.route("**/api/farms/*/weather", (r) =>
      r.fulfill(
        success
          ? {
              json: {
                data: {
                  temperatureC: 29,
                  humidityPercent: 74,
                  windSpeedKmh: 9,
                  observedAt: new Date().toISOString(),
                  fetchedAt: new Date().toISOString(),
                },
              },
            }
          : { status: 503, json: failure },
      ),
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Cuaca lahan" }),
    ).toBeVisible();
    await expect(page.locator("main")).toContainText(
      success ? "29 °C" : failure.error.message,
    );
    await fits(page);
    await page.unroute("**/api/farms/*/weather");
  }
});

test("farm save failures stay visible inside the dialog and preserve input", async ({
  page,
}) => {
  await page.route("**/api/farms", (r) =>
    r.request().method() === "POST"
      ? r.fulfill({ status: 503, json: failure })
      : r.fallback(),
  );
  await page.goto("/lahan");
  await page.getByRole("button", { name: "Tambah lahan", exact: true }).click();
  await page.getByLabel("Nama lahan", { exact: true }).fill("Belum disimpan");
  await page.getByLabel("Lokasi", { exact: true }).fill("Lokasi pengujian");
  await page.getByLabel("Luas lahan (m²)", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Simpan lahan", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Lahan belum tersimpan",
  );
  await expect(page.getByLabel("Nama lahan", { exact: true })).toHaveValue(
    "Belum disimpan",
  );
  await expect(
    page.getByRole("button", { name: "Simpan lahan", exact: true }),
  ).toBeEnabled();
});

test("reports expose loading, failures, and empty states without stale charts", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/reports?*", async (r) => {
    await gate;
    await r.fulfill({ status: 503, json: failure });
  });
  try {
    await page.goto("/analisis");
    await expect(
      page.getByText("Memuat laporan…", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    failure.error.message,
  );
  await expect(
    page.getByRole("button", { name: "Unduh CSV", exact: true }),
  ).toBeDisabled();
  await page.unroute("**/api/reports?*");
  await page.route("**/api/reports?*", (r) =>
    r.fulfill({ json: { data: { readings: [], events: [] } } }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Belum ada pembacaan sensor" }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /Grafik pembacaan/ })).toHaveCount(
    0,
  );
});

for (const scenario of [
  { open: /^Ubah Zona/, submit: "Simpan zona", error: "Zona belum tersimpan" },
  {
    open: /^Hapus Zona/,
    submit: "Hapus zona",
    error: "Zona belum dapat diarsipkan",
  },
  {
    open: /^Hapus Sawah pengujian$/,
    submit: "Hapus lahan",
    error: "Lahan belum dapat diarsipkan",
  },
])
  test(`${scenario.submit}: failures remain visible in the active dialog`, async ({
    page,
  }) => {
    await page.route("**/api/**", (route) =>
      ["POST", "PATCH", "DELETE"].includes(route.request().method())
        ? route.fulfill({ status: 503, json: failure })
        : route.fallback(),
    );
    await page.goto("/lahan");
    const card = page.getByTestId("farm-card").filter({
      has: page.getByRole("heading", {
        name: "Sawah pengujian",
        exact: true,
      }),
    });
    await card.getByRole("button", { name: scenario.open }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: scenario.submit, exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText(scenario.error);
    await expect(
      dialog.getByRole("button", { name: scenario.submit, exact: true }),
    ).toBeEnabled();
  });

test("long names and readings remain contained across every page", async ({
  page,
  request,
}) => {
  const snapshot: WorkspaceSnapshot = (
    await (await request.get("/api/workspace")).json()
  ).data;
  await page.route("**/api/workspace", (r) =>
    r.fulfill({
      json: {
        data: {
          ...snapshot,
          user: { ...snapshot.user, name: "Pengguna".repeat(10) },
          farms: snapshot.farms.map((f) => ({
            ...f,
            name: "Sawah".repeat(14),
            location: "Lokasi".repeat(16),
          })),
          zones: snapshot.zones.map((z) => ({
            ...z,
            name: "Petak".repeat(12),
            hasReading: true,
            moisture: 69,
            water: 6.5,
          })),
        },
      },
    }),
  );
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(`/${route}`);
      await ready(page, route);
      await fits(page);
    }
  }
});

test("unexpected rendering errors show the application recovery screen", async ({
  page,
}) => {
  await page.route("**/api/workspace", (r) =>
    r.fulfill({ json: { data: {} } }),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Halaman belum dapat ditampilkan" }),
  ).toBeVisible();
  await fits(page);
  await page.unroute("**/api/workspace");
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard lahan" }),
  ).toBeVisible();
});

test("user list loading and failure states do not imply an empty result", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/users?*", async (r) => {
    await gate;
    await r.fulfill({ status: 503, json: failure });
  });
  try {
    await page.goto("/pengguna");
    await expect(
      page.getByText("Memuat daftar pengguna…", { exact: true }),
    ).toBeVisible();
    await fits(page);
  } finally {
    release();
  }
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    failure.error.message,
  );
  await expect(
    page.getByRole("heading", { name: "Belum ada pengguna" }),
  ).toHaveCount(0);
  await page.unroute("**/api/users?*");
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
