# Arsitektur SmartFarm IoT

## Keputusan struktur

Proyek menggunakan Next.js 16.4.6 App Router, React 19.3, dan TypeScript strict.
Next.js tidak mewajibkan satu susunan folder fitur. Susunan berikut dipilih agar
anggota tim bisa menemukan route, tampilan, state contoh, dan kode server dengan
cepat tanpa menambah layer yang belum dibutuhkan.

```text
src/
  app/                         Route, layout, metadata, dan endpoint API
    (preview)/                 Group route, tidak menjadi bagian URL
      (workspace)/             Layout/sidebar untuk lima halaman utama
      login/                   Login akun nyata
    api/                       Endpoint server yang sudah ada
    globals.css                Reset dan aturan dasar dokumen
  assets/fonts/                Font lokal beserta lisensi
  components/
    layout/                    Brand dan kerangka navigasi aplikasi
    ui/                        Badge, dialog, field, judul, empty state, ikon
  features/
    auth/components/           Tampilan login pratinjau
    dashboard/components/      Ringkasan, kartu zona, gauge, cuaca/lahan
    irrigation/components/     Kontrol dan formulir aturan irigasi
    analytics/
      components/              Halaman analisis dan grafik
      lib/                     Perhitungan seri dan pembuatan CSV murni
      types.ts                 Tipe data grafik
    farms/components/          Daftar, kartu, dialog, formulir, pemilih lahan
    notifications/components/  Notifikasi dan preferensi contoh
    workspace/                 Kontrak DTO dan provider data akun dari API
    users/components/          Pengguna, kepemilikan dan penugasan
  domain/                      Model dan validasi domain, tanpa UI
  lib/                         Helper umum kecil, misalnya cn dan unduhan teks
  server/
    auth/                      Policy akses, password, dan query pengguna
    db/                        Koneksi, indeks, dan akses collection MongoDB
    integrations/              Konfigurasi layanan cuaca dan WhatsApp
  styles/                      Token dan primitive visual yang dipakai bersama
  types/                       Augmentasi tipe pustaka, misalnya Auth.js
  auth.ts                      Konfigurasi Auth.js khusus server
tests/
  *.test.ts                    Unit test menggunakan node:test dan tsx
  e2e/                         Test Playwright untuk route dan alur frontend
public/images/                 Foto lokal yang digunakan frontend
```

## Batas server dan client

- Pengalihan tetap `/` ke `/dashboard` menggunakan `redirects()` di
  `next.config.ts` dengan status sementara 307. Pengalihan ini berjalan sebelum
  render sehingga tidak memerlukan halaman root atau melempar `NEXT_REDIRECT`
  saat validasi `instant`. Gunakan `redirect()` pada route yang tujuannya perlu
  ditentukan saat render, misalnya berdasarkan sesi pengguna.
- `page.tsx` dan `layout.tsx` tetap Server Components. File tersebut merangkai
  halaman, metadata, dan layout; logika layar berada di folder fitur.
- Tambahkan `"use client"` pada komponen yang membutuhkan state, event handler,
  effect, atau API browser. Komponen UI statis tidak membutuhkan directive itu.
- Login berdiri sendiri. Layout workspace memeriksa sesi Auth.js di balik Suspense.
  WorkspaceProvider memuat snapshot dari API, menunggu hasil mutation sebelum
  memperbarui state, dan mengarahkan sesi yang tidak valid kembali ke login.
  Tidak ada selector peran atau penyimpanan data pribadi di localStorage.
- Keenam halaman privat mendeklarasikan `instant = false` karena menunggu data
  akun pada provider. Deklarasi layout tidak menggantikan validasi implicit tiap
  page pada versi Next.js ini. Cache Components dan Partial Prefetching tetap aktif;
  halaman login tetap memakai validasi bawaan.
- Boundary sesi memanggil `connection()` di dalam Suspense sebelum Auth.js agar
  kriptografi autentikasi berjalan pada request pengguna, bukan saat prerender.
- `src/auth.ts` ditandai `server-only`. ESLint melarang komponen UI dan fitur
  mengimpor `@/server/**` atau `@/auth`. Tipe/data domain yang benar-benar dapat
  dibagi tetap berada di `domain/`.
- Modul database/password juga dipakai script administrator di Node.js. Jangan
  menaruh akses database atau secret ke komponen client demi kemudahan impor.

Frontend memakai sesi Auth.js dan data MongoDB melalui API. Peran ditentukan
profil database. Kontrol perangkat dan eksekusi otomatis menunggu hardware;
pengiriman WhatsApp memerlukan konfigurasi dan tindakan uji yang eksplisit.

## Styling

- `styles/tokens.css`: warna, border, radius, skala jarak 4–32 px dan nilai tema bersama.
- `styles/primitives.css`: class bersama untuk tombol, panel, field, badge,
  dialog, dan susunan umum. Ini adalah kontrak visual aplikasi.
- Gunakan `page-stack` untuk jarak antarbagian halaman (24 px), `stack` untuk
  grup isi panel, dan `form-stack` untuk jarak antarisian (20 px). Gunakan
  `form-actions` untuk tombol yang sejajar; jangan memakai toolbar sebagai
  tata letak checkbox. Detail khusus halaman tetap berada di CSS Module fitur.
- Grafik mengikuti ukuran kontainernya dengan `ResizeObserver`, tinggi 260 px
  di ponsel dan 300 px di layar lain. Perhitungan titik/sumbu berada di
  `analytics/lib/chart-layout.ts`. Satu pembacaan ditampilkan sebagai titik
  tanpa area tren; label waktu menyesuaikan ruang yang tersedia.
- `features/<fitur>/<fitur>.module.css`: styling khusus fitur yang diimpor
  melalui `styles`. `components/layout/workspace.module.css` menangani shell.
- Selector module yang menyentuh primitive bersama menggunakan `:global(...)`
  secara eksplisit, misalnya `.card :global(.button)`.
- Letakkan media query dekat aturan fitur terkait. Hindari menambahkan styling
  halaman baru ke `app/globals.css` atau menggunakan `overflow-x: hidden` untuk
  menyembunyikan masalah layout.

## Aturan impor dan penamaan

Gunakan `@/` untuk impor antar-folder dan impor relatif untuk tetangga dalam
fitur yang sama. Gunakan `import type` jika hanya membutuhkan tipe. Impor file
yang memiliki implementasi secara langsung; hindari barrel `index.ts` yang
menggabungkan modul server, client, dan seluruh fitur dalam satu entry point.

Nama file menggunakan kebab-case. Nama komponen menggunakan PascalCase, hook
diawali `use`, dan helper diberi nama sesuai hasilnya. Pecah komponen ketika
memiliki beberapa tanggung jawab, bukan semata untuk mengejar jumlah baris.

## Boundary backend

Kode database, kebijakan akses dan integrasi berada di `src/server/`. Route Handler
memvalidasi input melalui Zod dan memeriksa profil aktif/otorisasi per resource.
`src/domain/workspace.ts` dan `src/domain/report.ts` mendefinisikan kontrak input;
DTO browser berada di `src/features/workspace/types.ts`. Detail endpoint, setup
admin, batas hardware dan pengujian dijelaskan dalam [BACKEND.md](BACKEND.md).

## Sumber keputusan

Panduan yang sesuai versi terpasang dibaca dari `node_modules/next/dist/docs/`.
Referensi resmi yang dapat dibaca tim:

- [Struktur proyek](https://nextjs.org/docs/app/getting-started/project-structure)
- [Server dan Client Components, termasuk penempatan provider](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)
- [CSS Modules dan CSS global](https://nextjs.org/docs/app/getting-started/css)
- [Image: preload, loading, dan deprecation priority](https://nextjs.org/docs/app/api-reference/components/image)
- [Playwright pada Next.js](https://nextjs.org/docs/app/guides/testing/playwright)
