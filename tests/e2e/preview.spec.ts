import { expect, test, type Page } from "@playwright/test";

const routes = [
  "dashboard",
  "login",
  "irigasi",
  "analisis",
  "notifikasi",
  "lahan",
];
const browserErrors = new WeakMap<Page, string[]>();
const apiRequests = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  browserErrors.set(page, errors);
  apiRequests.set(page, requests);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(request.url());
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
  expect(apiRequests.get(page)).toEqual([]);
});

for (const width of [320, 375, 768, 1024, 1440, 1920, 2560]) {
  for (const route of routes) {
    test(`${route} fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`/${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }
}

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Navigasi utama", exact: true })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
}

test("dialog keyboard behavior and demo login", async ({ page }) => {
  await page.goto("/login");
  const help = page.getByRole("button", { name: "Bantuan masuk", exact: true });
  await help.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
  await page.getByPlaceholder("nama@contoh.com").fill("petani@example.com");
  await page.getByPlaceholder("Minimal 8 karakter").fill("contoh123");
  await page
    .getByRole("button", { name: "Tampilkan kata sandi", exact: true })
    .click();
  await expect(page.getByPlaceholder("Minimal 8 karakter")).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Masuk ke demo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("irrigation survives navigation, stops, and respects preview permissions", async ({
  page,
}) => {
  await page.goto("/irigasi");
  await page.getByRole("button", { name: "5 detik", exact: true }).click();
  await page
    .getByRole("button", { name: "Mulai simulasi irigasi", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mulai simulasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Air sedang mengalir", exact: true }),
  ).toBeVisible();
  await navigate(page, "Dashboard");
  await expect(
    page.getByRole("heading", { name: "Air sedang mengalir", exact: true }),
  ).toBeVisible();
  await navigate(page, "Irigasi");
  await expect(
    page.getByRole("button", { name: "Mulai simulasi irigasi", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  await page.getByLabel("Pilih zona irigasi").selectOption("zone-3");
  await expect(
    page.getByRole("button", { name: "Mulai simulasi irigasi", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Pilih zona irigasi").selectOption("zone-1");
  await page
    .getByRole("button", { name: "Aturan otomatis", exact: true })
    .click();
  await page.getByLabel(/Ambang kelembapan/).fill("35");
  await page
    .getByRole("button", { name: "Simpan aturan contoh", exact: true })
    .click();
  await navigate(page, "Dashboard");
  await navigate(page, "Irigasi");
  await page
    .getByRole("button", { name: "Aturan otomatis", exact: true })
    .click();
  await expect(page.getByLabel(/Ambang kelembapan/)).toHaveValue("35");
  await page
    .getByLabel("Pratinjau peran", { exact: true })
    .selectOption("Pekerja lapangan");
  await expect(
    page.getByRole("switch", { name: "Aktifkan aturan otomatis" }),
  ).toBeDisabled();
  await navigate(page, "Lahan & sensor");
  await expect(
    page.getByRole("button", { name: "Tambah lahan", exact: true }),
  ).toHaveCount(0);
});

test("farm and zone changes persist through client navigation", async ({
  page,
}) => {
  await page.goto("/lahan");
  await page.getByRole("button", { name: "Tambah lahan", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama lahan", { exact: true }).fill("Lahan Uji");
  await dialog.getByLabel("Lokasi", { exact: true }).fill("Tikung, Lamongan");
  await dialog.getByLabel("Luas lahan (m²)", { exact: true }).fill("1200");
  await dialog
    .getByRole("button", { name: "Simpan lahan", exact: true })
    .click();
  const card = page.getByTestId("farm-card").filter({
    has: page.getByRole("heading", { name: "Lahan Uji", exact: true }),
  });
  await card.getByRole("button", { name: "Tambah zona", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama zona", { exact: true }).fill("Petak Uji");
  await dialog
    .getByRole("button", { name: "Simpan zona", exact: true })
    .click();
  await card
    .getByRole("button", { name: "Ubah Petak Uji", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nama zona", { exact: true })
    .fill("Petak Baru");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Simpan zona", exact: true })
    .click();
  await navigate(page, "Dashboard");
  await expect(
    page.getByRole("heading", { name: "Lahan Uji", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Petak Baru", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("zone-readings")).toContainText("—");
  await navigate(page, "Lahan & sensor");
  await page.getByLabel("Cari lahan").fill("tidak ditemukan");
  await expect(
    page.getByRole("heading", { name: "Lahan tidak ditemukan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await page
    .getByRole("button", { name: "Hapus Lahan Uji", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus lahan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lahan Uji", exact: true }),
  ).toHaveCount(0);
});

test("analytics downloads the selected CSV and validates dates", async ({
  page,
}) => {
  await page.goto("/analisis");
  await page.getByRole("button", { name: "7 hari", exact: true }).click();
  await page
    .getByLabel("Jenis pembacaan", { exact: true })
    .selectOption("water");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh CSV", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv.split("\r\n")).toHaveLength(8);
  expect(csv).toContain("CONTOH");
  await page.getByRole("button", { name: "Kustom", exact: true }).click();
  await page.getByLabel(/Sampai tanggal/).fill("2026-11-01");
  await expect(
    page.getByRole("alert").filter({ hasText: "Pilih rentang tanggal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unduh CSV", exact: true }),
  ).toBeDisabled();
});

test("notifications and mobile role preview stay local", async ({ page }) => {
  await page.goto("/notifikasi");
  await page
    .getByRole("button", { name: "Tandai semua dibaca", exact: true })
    .click();
  await page.getByRole("button", { name: "Belum dibaca", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Semua sudah Anda lihat", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Coba pratinjau pesan", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("tidak dikirim");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Pratinjau pesan dibuat", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  await page
    .getByRole("button", { name: "PS: buka profil demo", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Pratinjau peran")
    .selectOption("Admin");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Selesai", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Navigasi seluler", exact: true })
    .getByRole("link", { name: "Lahan", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tambah lahan", exact: true }),
  ).toBeVisible();
});
