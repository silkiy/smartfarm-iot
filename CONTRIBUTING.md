# Panduan maintenance

## Menjalankan proyek

Gunakan Node.js minimal 20.9, sesuai Next.js versi terpasang, lalu jalankan:

```bash
npm ci
npm run dev
```

Login dan data aplikasi memerlukan MongoDB serta AUTH_SECRET. Buat akun awal
dengan `npm run bootstrap:admin`; ikuti [BACKEND.md](BACKEND.md) untuk setup.

## Perintah rutin

| Perintah               | Kegunaan                                                  |
| ---------------------- | --------------------------------------------------------- |
| `npm run format`       | Format source dan dokumen dengan Prettier                 |
| `npm run format:check` | Periksa format tanpa mengubah file                        |
| `npm run lint`         | ESLint, termasuk batas impor server/client, tanpa warning |
| `npm run typecheck`    | Regenerasi tipe route Next.js dan periksa TypeScript      |
| `npm test`             | Unit test domain, policy, provider, grafik, dan ekspor    |
| `npm run check`        | Format check, lint, typecheck, lalu unit test             |
| `npm run build`        | Build produksi Next.js                                    |
| `npm run test:e2e`     | Test browser dan responsivitas dengan Playwright          |
| `npm run test:e2e:ui`  | Buka antarmuka interaktif Playwright                      |

Untuk test browser, siapkan MongoDB khusus pengujian. Jangan gunakan database
aplikasi utama. Detail server produksi/tes ada di [BACKEND.md](BACKEND.md).

Untuk test browser pertama kali:

```bash
npx playwright install chromium
# Tetapkan TEST_MONGODB_URI ke database smartfarm_test_* sebelum menjalankan suite.
npm run test:e2e
```

Jika ingin memakai Chrome yang sudah terpasang pada Windows/PowerShell:

```powershell
$env:TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/smartfarm_test_e2e"
$env:PLAYWRIGHT_CHANNEL = "chrome"
npm run test:e2e
```

Playwright menyiapkan server sendiri di `127.0.0.1:3120`. Hasil HTML dapat dibuka
dengan `npx playwright show-report`; trace/screenshot kegagalan berada dalam
`test-results/`. Kedua folder hasil pengujian tidak disimpan ke Git.

## Lokasi perubahan yang umum

| Yang ingin diubah                   | Lokasi                                            |
| ----------------------------------- | ------------------------------------------------- |
| URL atau metadata halaman           | `src/app/(preview)/.../page.tsx`                  |
| Sidebar, header, menu bawah         | `src/components/layout/`                          |
| Warna dan tema                      | `src/styles/tokens.css`                           |
| Tombol, panel, field bersama        | `src/styles/primitives.css`, `src/components/ui/` |
| Isi/layout satu fitur               | `src/features/<fitur>/components/`                |
| Styling satu fitur                  | `src/features/<fitur>/<fitur>.module.css`         |
| Kontrak data browser                | `src/features/workspace/types.ts`                 |
| Data akun dan mutation API          | `src/features/workspace/workspace-provider.tsx`   |
| Perhitungan grafik dan CSV          | `src/features/analytics/lib/`                     |
| Database, akses pengguna, integrasi | `src/server/`                                     |

Tambahkan route sebagai Server Component yang tipis. Pecah tampilan dan helper
sesuai tanggung jawab. Simpan logika murni di `lib/` fitur dan tambahkan test
perilakunya; gunakan Playwright untuk perubahan interaksi atau layout.

## Sebelum menyimpan perubahan

Jalankan `npm run check` dan `npm run build`. Untuk perubahan UI, jalankan
`npm run test:e2e` serta tinjau tampilan ponsel dan desktop. Test browser saat ini
mencakup tujuh halaman pada lebar 320–2560 px, login/logout, persistensi CRUD,
aturan, preferensi, pengguna, otorisasi lintas akun dan notifikasi per akun.
Pengujian ini tidak menggantikan Safari/mobile native atau perangkat IoT fisik.

## Catatan environment dan dependency

- `.env*`, credential dan secret tidak masuk Git. Jangan memakai `NEXT_PUBLIC_`
  untuk connection string database atau token layanan.
- `docs/`, `prd/`, `design/`, dan `tasks/` mengikuti aturan ignore proyek yang
  sudah ada. Panduan maintenance utama disimpan di root agar ikut version control.
- Pada Windows dengan sandbox ketat, Turbopack bisa gagal membuat junction
  dependency. Jalankan build di terminal biasa dengan izin workspace yang sesuai;
  jangan menonaktifkan pemeriksaan tipe atau lint untuk melewati masalah ini.
- Audit npm pada 18 November 2026 mencatat 15 advisory pada rantai dependency
  development ESLint yang sudah ada (6 moderate, 9 high). Versi rantai tersebut
  tidak berubah oleh penambahan Prettier/Playwright. Jangan menjalankan
  `npm audit fix --force` tanpa review: rekomendasinya dapat menurunkan
  `eslint-config-next` dari versi 16 ke 14. Pembaruan dependency perlu ditangani
  sebagai perubahan terpisah dengan pemeriksaan kompatibilitas.
