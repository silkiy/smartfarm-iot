# Task Breakdown (`todo.md`): Hidroponik NFT Kangkung IoT (Clean Build)

> **Aturan Pengerjaan:** Kerjakan task secara berurutan mengikuti dependensi. Jangan lompat melewati **Checkpoint** sebelum semua kriteria verifikasi lulus.

---

## Phase 1: Fondasi & Autentikasi

### Task 1: Inisialisasi Proyek Next.js 16 & Test Runner
**Description:** Menyiapkan struktur proyek clean build Next.js 16 (App Router, TypeScript strict mode, Tailwind CSS) beserta test runner (Vitest) dan skrip standar (`dev`, `build`, `lint`, `test`) agar seluruh slice berikutnya punya fondasi yang terverifikasi.

**Acceptance criteria:**
- [x] `package.json` menggunakan Next.js 16, TypeScript (`strict: true` di `tsconfig.json`), Tailwind CSS, dan `zod`.
- [x] Test runner (`vitest`) terkonfigurasi dan mampu menjalankan unit test TypeScript.
- [x] Struktur direktori dasar (`src/app`, `src/lib`, `tests`, `.env.example`) tersedia dan bebas file sisa build lama.

**Verification:**
- [x] Tests pass: `npm test`
- [x] Lint & build succeed: `npm run lint && npm run build`

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `.env.example`
- `src/app/layout.tsx`

**Estimated scope:** Medium (3–5 files)

---

### Task 2: Validasi Env (Zod), Koneksi Singleton MongoDB & Index Script
**Description:** Membuat modul validasi *environment variables* dengan Zod (`fail-fast`), koneksi singleton MongoDB Official Node.js Driver yang aman untuk mode development/serverless, serta script CLI untuk membuat index koleksi (`users`, `devices`, `telemetry`, `alerts`).

**Acceptance criteria:**
- [x] Aplikasi melempar error deskriptif jika `MONGODB_URI`, `MONGODB_DB_NAME`, atau `AUTH_SECRET` tidak valid/hilang.
- [x] Helper `getDb()` mengembalikan instance `Db` dari koneksi singleton tanpa membuat koneksi baru berulang di dev.
- [x] Script index membuat unique index `users.email`, `devices.deviceId`, `devices.apiKeyHash`, serta compound index `telemetry` & `alerts` tanpa error idempotent.

**Verification:**
- [x] Tests pass: `npm test -- env db`
- [x] Manual/CLI check: `npx tsx scripts/ensure-indexes.ts` berhasil terhadap MongoDB Atlas/local

**Dependencies:** Task 1

**Files likely touched:**
- `src/lib/env.ts`
- `src/lib/db.ts`
- `scripts/ensure-indexes.ts`
- `tests/env.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Checkpoint 1: Foundation
- [x] `npm run lint`, `npm test`, dan `npm run build` lulus tanpa error
- [x] Koneksi MongoDB Atlas dan script `ensure-indexes.ts` terverifikasi
- [x] Review struktur dasar bersama user sebelum lanjut ke Auth

---

### Task 3: Fitur Registrasi Pengguna (`/register`)
**Description:** Mengimplementasikan alur registrasi pengguna baru secara vertikal: skema Zod input registrasi, hashing password (mis. `bcryptjs` / `argon2`), penyimpanan user baru ke koleksi `users` dengan default role `USER`, dan halaman UI `/register`.

**Acceptance criteria:**
- [ ] Email duplikat ditolak dengan pesan error jelas (HTTP `409` / pesan form).
- [ ] Password disimpan sebagai hash (tidak pernah plain-text) dan role selalu di-set `USER` oleh server (mengabaikan input role dari client).
- [ ] Pengguna dapat mengisi form `/register` dan diarahkan ke `/login` setelah berhasil.

**Verification:**
- [ ] Tests pass: `npm test -- register`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Daftar akun baru via `/register` dan cek dokumen di koleksi `users`

**Dependencies:** Task 2

**Files likely touched:**
- `src/lib/validations/auth.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/register/page.tsx`
- `tests/auth-register.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 4: Fitur Login & Sesi Auth.js v5 (`/login`)
**Description:** Mengonfigurasi Auth.js v5 dengan Credentials Provider untuk memverifikasi email & password dari MongoDB, menyertakan `id` dan `role` pada JWT/session callback, serta membangun halaman UI `/login`.

**Acceptance criteria:**
- [ ] Login dengan kredensial valid membuat sesi yang menyimpan `session.user.id` dan `session.user.role`.
- [ ] Login dengan email/password salah menampilkan pesan error generik tanpa membocorkan detail akun.
- [ ] Halaman `/login` berhasil mengarahkan user terautentikasi ke `/dashboard`.

**Verification:**
- [ ] Tests pass: `npm test -- auth-login`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Login via `/login`, verifikasi cookie sesi aktif dan data user tampil

**Dependencies:** Task 3

**Files likely touched:**
- `src/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/login/page.tsx`
- `src/types/next-auth.d.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 5: Middleware Proteksi Rute & Helper Otorisasi (`USER` vs `ADMIN`)
**Description:** Menambahkan middleware Next.js untuk melindungi seluruh rute `/dashboard/*`, serta helper server-side untuk memeriksa sesi dan membatasi akses berdasarkan kepemilikan (`ownerId`) atau peran `ADMIN`.

**Acceptance criteria:**
- [ ] Akses ke `/dashboard` atau `/dashboard/*` tanpa sesi aktif otomatis dialihkan ke `/login`.
- [ ] Pengguna yang sudah login saat membuka `/login` atau `/register` dialihkan ke `/dashboard`.
- [ ] Helper otorisasi (`requireSession`, `requireDeviceAccess`, `requireAdmin`) menolak akses lintas user (`403`) dan non-admin (`403`).

**Verification:**
- [ ] Tests pass: `npm test -- rbac`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buka `/dashboard` dalam mode incognito → ter-redirect ke `/login`

**Dependencies:** Task 4

**Files likely touched:**
- `src/proxy.ts` (konvensi Next.js 16; gunakan `src/middleware.ts` hanya jika versi Next.js terpasang masih mewajibkannya)
- `src/lib/auth-guard.ts`
- `tests/rbac.test.ts`

**Estimated scope:** Small (2–3 files)

---

### Checkpoint 2: Autentikasi & Proteksi Rute
- [ ] `npm test`, `npm run lint`, dan `npm run build` lulus
- [ ] Alur `/register` → `/login` → `/dashboard` dan redirect non-login berjalan end-to-end
- [ ] Review bersama user sebelum masuk ke manajemen perangkat

---

## Phase 2: Manajemen Perangkat (Multi-User Isolation)

### Task 6: Fitur Add Device & One-Time API Key Generation
**Description:** Membangun alur pendaftaran perangkat ESP32 baru (*Add Device*): validasi Zod untuk nama perangkat, `deviceId` (manual atau auto-generate), dan format `macAddress`, lalu menghasilkan `x-api-key` acak yang disimpan sebagai hash (`SHA-256`) di koleksi `devices` dan ditampilkan satu kali ke user.

**Acceptance criteria:**
- [ ] Pengguna dapat mendaftarkan perangkat dengan Nama, ID (atau auto-generate), dan MAC Address valid.
- [ ] `apiKeyHash` tersimpan di MongoDB sebagai hash, sementara plain-text API key hanya dikembalikan satu kali di respons pembuatan.
- [ ] Duplikasi `deviceId` atau `macAddress` ditolak dengan status/pesan error yang jelas.

**Verification:**
- [ ] Tests pass: `npm test -- device-create`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Tambah 1 perangkat di `/dashboard/devices` dan pastikan modal/banner one-time API key muncul

**Dependencies:** Task 5

**Files likely touched:**
- `src/lib/crypto.ts`
- `src/lib/validations/device.ts`
- `src/app/api/devices/route.ts`
- `src/components/devices/AddDeviceForm.tsx`
- `tests/device-create.test.ts`

**Estimated scope:** Medium (4–5 files)

---

### Task 7: Daftar Perangkat (`/dashboard/devices`) & Status ONLINE/OFFLINE
**Description:** Menampilkan daftar perangkat milik pengguna yang sedang login (`ownerId === session.user.id`) beserta badge status koneksi (`ONLINE` jika `now - lastSeenAt <= 30 detik`, `OFFLINE` jika `> 30 detik` atau belum pernah terhubung).

**Acceptance criteria:**
- [ ] Halaman `/dashboard/devices` hanya menampilkan perangkat milik akun `USER` yang login.
- [ ] Fungsi kalkulasi status menandai `OFFLINE` tepat ketika selisih `lastSeenAt` > 30 detik.
- [ ] Pengguna yang login sebagai User B tidak melihat perangkat milik User A.

**Verification:**
- [ ] Tests pass: `npm test -- device-status`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buat 2 akun berbeda, tambah perangkat di akun A, verifikasi tidak muncul di akun B

**Dependencies:** Task 6

**Files likely touched:**
- `src/lib/device-status.ts`
- `src/app/dashboard/devices/page.tsx`
- `src/components/devices/DeviceList.tsx`
- `tests/device-status.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 8: Reset API Key & Hapus Perangkat (Dengan Isolasi Kepemilikan)
**Description:** Menambahkan endpoint dan tombol aksi pada setiap perangkat di `/dashboard/devices` untuk melakukan *Reset API Key* (menghasilkan kunci baru sekali lihat & mengganti hash lama) serta *Hapus Perangkat*, lengkap dengan verifikasi kepemilikan.

**Acceptance criteria:**
- [ ] *Reset API Key* langsung menginvalidasi API key lama dan menampilkan API key baru tepat satu kali.
- [ ] *Hapus Perangkat* menghapus perangkat dari koleksi `devices` dan mencegah penggunaan API key lamanya.
- [ ] User lain yang mencoba memanggil endpoint reset/delete untuk `deviceId` bukan miliknya ditolak dengan `403`/`404`.

**Verification:**
- [ ] Tests pass: `npm test -- device-manage`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Uji reset key & hapus perangkat dari UI `/dashboard/devices`

**Dependencies:** Task 7

**Files likely touched:**
- `src/app/api/devices/[deviceId]/route.ts`
- `src/app/api/devices/[deviceId]/reset-key/route.ts`
- `src/components/devices/DeviceActions.tsx`
- `tests/device-manage.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Checkpoint 3: Siklus Hidup Perangkat & Isolasi User
- [ ] Seluruh test manajemen perangkat lulus (`create`, `list`, `reset-key`, `delete`, isolasi user)
- [ ] `npm run build` bersih tanpa warning TypeScript
- [ ] Review bersama user sebelum masuk ke endpoint IoT & ESP32

---

## Phase 3: Backend IoT & Firmware ESP32

### Task 9: Endpoint IoT Ingest Telemetry (`POST /api/iot/telemetry`)
**Description:** Membangun Route Handler `POST /api/iot/telemetry` yang memverifikasi header `x-api-key` melalui hash lookup ke `devices`, memvalidasi payload sensor dengan Zod (`waterDistanceCm`, `soilMoisturePct`, `pumpState`, `servoState`, `mode`), menyimpan dokumen ke `telemetry`, dan memperbarui snapshot + `lastSeenAt` di `devices`. Field `ownerId`, `recordedAt` (UTC), dan `waterLevelPct` **tidak dikirim ESP32**: server menurunkan `ownerId` dari perangkat terautentikasi, menetapkan `recordedAt`, dan menghitung `waterLevelPct` (rumus mengikuti Open Question 2 di `tasks/plan.md`; jika belum dijawab, tanyakan sebelum mengimplementasikan bagian `%`).

**Acceptance criteria:**
- [ ] Request tanpa atau dengan `x-api-key` salah ditolak dengan HTTP `401`.
- [ ] Payload tidak valid (misal jarak negatif atau kelembapan > 100) ditolak dengan HTTP `400` dari Zod.
- [ ] Payload valid tersimpan ke koleksi `telemetry` dan memperbarui `lastSeenAt` serta snapshot sensor di `devices`.
- [ ] `ownerId`, `recordedAt`, dan `waterLevelPct` ditetapkan/dihitung server; nilai yang dikirim ESP32 untuk field tersebut diabaikan.

**Verification:**
- [ ] Tests pass: `npm test -- iot-telemetry`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Kirim POST via `curl` dengan `x-api-key` valid dan cek data masuk MongoDB

**Dependencies:** Task 6

**Files likely touched:**
- `src/lib/iot-auth.ts`
- `src/lib/validations/iot.ts`
- `src/app/api/iot/telemetry/route.ts`
- `tests/iot-telemetry.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 10: Service Evaluator Alert Otomatis (`TANK_LOW`, `TANK_CRITICAL`, `MEDIA_DRY`)
**Description:** Mengimplementasikan fungsi evaluator aturan bisnis yang dipanggil saat telemetri masuk: mencatat `TANK_CRITICAL` (`CRITICAL`) jika jarak `> 25 cm`, `TANK_LOW` jika `> 20 cm` hingga `25 cm`, dan `MEDIA_DRY` jika kelembapan `< 30%`, dengan deduplikasi agar tidak membanjiri koleksi `alerts` selama alert bertipe sama belum di-resolve.

**Acceptance criteria:**
- [ ] Jarak `> 25 cm` membuat alert `TANK_CRITICAL` dengan severity `CRITICAL`.
- [ ] Jarak `> 20 cm` dan `<= 25 cm` membuat alert `TANK_LOW`; kelembapan `< 30%` membuat alert `MEDIA_DRY`.
- [ ] Jika sudah ada alert aktif (`resolved: false`) dengan `deviceId` dan `type` yang sama, tidak membuat duplikat baru.

**Verification:**
- [ ] Tests pass: `npm test -- alert-evaluator`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 9

**Files likely touched:**
- `src/lib/alert-evaluator.ts`
- `src/app/api/iot/telemetry/route.ts`
- `tests/alert-evaluator.test.ts`

**Estimated scope:** Small (2–3 files)

---

### Task 11: Endpoint IoT Control Polling (`GET /api/iot/control`)
**Description:** Membangun Route Handler `GET /api/iot/control` untuk ESP32 (autentikasi `x-api-key`) yang mengembalikan perintah kontrol terbaru (`mode`, `desiredPumpState`, `triggerServoDose`), memperbarui `lastSeenAt`, dan menerapkan *server-side fail-safe guard* (`desiredPumpState` dipaksa `false` jika `lastWaterDistanceCm > 25`). Endpoint ini **khusus ESP32** (autentikasi `x-api-key`); jangan tertukar dengan `/api/devices/[deviceId]/control` untuk web (Task 16).

**Acceptance criteria:**
- [ ] Mengembalikan `401` jika `x-api-key` tidak valid.
- [ ] Mengembalikan JSON state kontrol perangkat dengan `Cache-Control: no-store`.
- [ ] Jika `lastWaterDistanceCm > 25`, respons selalu memaksa target pompa `OFF` (`false`) meskipun `mode === 'MANUAL'`.

**Verification:**
- [ ] Tests pass: `npm test -- iot-control`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `curl` ke `/api/iot/control` dengan `x-api-key` valid

**Dependencies:** Task 6

**Files likely touched:**
- `src/app/api/iot/control/route.ts`
- `tests/iot-control.test.ts`

**Estimated scope:** Small (2 files)

---

### Checkpoint 4: Backend IoT Contract
- [ ] Simulasi lengkap `POST /api/iot/telemetry` dan `GET /api/iot/control` lulus
- [ ] Alert `TANK_LOW`, `TANK_CRITICAL`, `MEDIA_DRY` teruji otomatis tanpa duplikasi
- [ ] `npm test` dan `npm run build` lulus

---

### Task 12: Firmware ESP32 — Modul Pembacaan Sensor (HC-SR04 & Soil Moisture)
**Description:** Membuat modul pembacaan sensor untuk ESP32 (38-pin): jarak ultrasonik HC-SR04 pada `GPIO 5` (TRIG) dan `GPIO 18` (ECHO) dengan *moving average/median filter* ringan, serta pembacaan analog Capacitive Soil Moisture v2.0 pada `GPIO 34` (`ADC1_CH6`) terkalibrasi ke `0–100%`.

**Acceptance criteria:**
- [ ] Konstanta pin sesuai hardware (`TRIG=5`, `ECHO=18`, `SOIL=34`, `RELAY=26`, `SERVO=25`).
- [ ] Pembacaan jarak dalam `cm` stabil dan menangani timeout echo (tidak membuat loop macet).
- [ ] Nilai soil moisture terkonversi akurat ke rentang `0–100%` menggunakan konstanta kalibrasi `AIR_VALUE` dan `WATER_VALUE`.

**Verification:**
- [ ] Compile check di Arduino IDE / PlatformIO berhasil tanpa error
- [ ] Manual check: Serial Monitor menampilkan jarak `cm` dan kelembapan `%` yang masuk akal saat diuji di air & udara

**Dependencies:** None (hardware track; parallelizable dengan Phase 1–2)

**Files likely touched:**
- `firmware/esp32-hydroponics/config.example.h`
- `firmware/esp32-hydroponics/sensors.h`

**Estimated scope:** Small (2 files)

---

### Task 13: Firmware ESP32 — State Machine Otomasi & Fail-Safe Lokal (`< 5 detik`)
**Description:** Mengimplementasikan state machine lokal berbasis `millis()` (non-blocking) di ESP32: fail-safe darurat (`> 25 cm` memaksa Relay `GPIO 26` OFF < 5 detik di semua mode), siklus pompa `AUTO` (5 menit ON / 10 menit OFF), backup hidrasi 2 menit saat soil `< 30%`, dan kontrol Servo SG90 (`GPIO 25`: `90°` selama 3 detik → `0°` + cooldown 60 detik) pada zona `> 20–25 cm`.

**Acceptance criteria:**
- [ ] Jarak `> 25 cm` langsung mematikan relay dalam < 5 detik baik pada mode `AUTO` maupun `MANUAL`.
- [ ] Mode `AUTO` menjalankan siklus 5 menit ON / 10 menit OFF serta backup 2 menit saat soil `< 30%` dan level air `<= 25 cm`.
- [ ] Pada zona `> 20–25 cm` di mode `AUTO`, servo membuka `90°` selama 3 detik, menutup `0°`, dan menunggu cooldown 60 detik.

**Verification:**
- [ ] Compile check di Arduino IDE / PlatformIO berhasil
- [ ] Manual check: Uji skenario air > 25 cm di prototipe fisik dan ukur waktu mati relay (< 5 detik)

**Dependencies:** Task 12

**Files likely touched:**
- `firmware/esp32-hydroponics/automation.h`

**Estimated scope:** Small (1 file)

---

### Task 14: Firmware ESP32 — Klien HTTPS, Telemetri (10–15s) & Polling Kontrol (≤ 5s)
**Description:** Mengintegrasikan WiFi 2.4 GHz, klien HTTPS ke Next.js API (`/api/iot/telemetry` dan `/api/iot/control`) dengan header `x-api-key`, timer kirim telemetri setiap 10–15 detik, dan loop polling kontrol setiap ≤ 5 detik untuk menjalankan mode `MANUAL`.

**Acceptance criteria:**
- [ ] ESP32 terhubung ke WiFi 2.4 GHz dan mengirim telemetri setiap 10–15 detik ke `/api/iot/telemetry`.
- [ ] ESP32 melakukan polling ke `/api/iot/control` setiap ≤ 5 detik dan memperbarui mode (`AUTO`/`MANUAL`), status pompa manual, atau pemicu dosis servo 3 detik.
- [ ] Kegagalan jaringan/HTTP sementara tidak menghentikan loop *fail-safe* lokal di ESP32.

**Verification:**
- [ ] Compile check & upload ke ESP32 berhasil
- [ ] Manual check: Serial Monitor menunjukkan HTTP `200` untuk telemetry & control, dan status perangkat di MongoDB/UI berubah menjadi `ONLINE`

**Dependencies:** Task 9, Task 11, Task 13

**Files likely touched:**
- `firmware/esp32-hydroponics/esp32-hydroponics.ino`
- `firmware/esp32-hydroponics/network.h`

**Estimated scope:** Small (2 files)

---

### Checkpoint 5: Hardware-to-Cloud End-to-End
- [ ] ESP32 terhubung stabil ke endpoint Vercel/lokal dan mengirim data tiap 10–15 detik
- [ ] Uji fisik *fail-safe*: sensor diangkat > 25 cm → pompa mati < 5 detik & `TANK_CRITICAL` tercatat
- [ ] Review bersama user sebelum membangun UI monitoring & kontrol

---

## Phase 4: Monitoring, Kontrol & Grafik Riwayat

### Task 15: Dashboard Monitoring Real-Time (`/dashboard` & `/dashboard/devices/[deviceId]`)
**Description:** Membangun halaman utama `/dashboard` (ringkasan & auto-redirect/pilihan perangkat pertama) dan `/dashboard/devices/[deviceId]` lengkap dengan *Device Switcher*, 5 kartu metrik real-time (ketinggian air `cm` & `%`, kelembapan `%`, status pompa, status servo, mode operasi), dan polling UI berkala.

**Acceptance criteria:**
- [ ] Pengguna dengan > 1 perangkat dapat berpindah perangkat melalui *Device Switcher*.
- [ ] Halaman menampilkan jarak air (`cm`), persentase kapasitas (`%`), kelembapan media (`%`), status pompa (`ON`/`OFF`), status servo (`TERBUKA`/`TERTUTUP`), dan mode (`AUTO`/`MANUAL`).
- [ ] Akses ke `[deviceId]` milik user lain ditolak (`403`/`404`).

**Verification:**
- [ ] Tests pass: `npm test -- dashboard-view`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buka `/dashboard` dengan akun berisi perangkat online dan lihat nilai ter-update berkala

**Dependencies:** Task 7, Task 9

**Files likely touched:**
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/devices/[deviceId]/page.tsx`
- `src/components/dashboard/DeviceSwitcher.tsx`
- `src/components/dashboard/MetricCards.tsx`
- `src/app/api/devices/[deviceId]/telemetry/latest/route.ts`

**Estimated scope:** Medium (4–5 files)

---

### Task 16: Panel Kontrol Aktuator (`/dashboard/devices/[deviceId]/control`)
**Description:** Membangun API dan UI panel kontrol pada `/dashboard/devices/[deviceId]/control` dengan toggle mode `AUTO`/`MANUAL`, tombol Nyalakan/Matikan Pompa (aktif hanya di `MANUAL`), tombol Buka Dispenser Nutrisi (3 Detik), dan blokir keselamatan di sisi server & UI jika air kritis (`> 25 cm`). API web `/api/devices/[deviceId]/control` (autentikasi sesi) hanya menulis *desired state* ke `devices`; berbeda dari `/api/iot/control` untuk ESP32 (Task 11).

**Acceptance criteria:**
- [ ] Toggle `AUTO`/`MANUAL` tersimpan ke MongoDB dan segera terbaca di polling ESP32 berikutnya (≤ 5 detik).
- [ ] Tombol kendali pompa & servo hanya aktif saat mode `MANUAL`, dan server menolak perintah menyalakan pompa saat jarak air `> 25 cm`.
- [ ] Akses user non-pemilik ditolak (`403`/`404`).

**Verification:**
- [ ] Tests pass: `npm test -- device-control`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Switch ke `MANUAL`, klik Nyalakan Pompa, verifikasi relay ESP32 aktif ≤ 5 detik

**Dependencies:** Task 11, Task 15

**Files likely touched:**
- `src/app/api/devices/[deviceId]/control/route.ts`
- `src/app/dashboard/devices/[deviceId]/control/page.tsx`
- `src/components/devices/ControlPanel.tsx`
- `tests/device-control.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 17: Grafik Riwayat Telemetri (`/dashboard/devices/[deviceId]/history`)
**Description:** Membangun endpoint query historis (`1h`, `24h`, `7d`) pada koleksi `telemetry` dengan agregasi/downsampling ringan agar performa tetap cepat, serta halaman grafik tren jarak permukaan air (`cm`) dan kelembapan media (`%`).

**Acceptance criteria:**
- [ ] API riwayat memvalidasi parameter range (`1h`, `24h`, `7d`) dengan Zod dan memfilter `ownerId`.
- [ ] Halaman `/dashboard/devices/[deviceId]/history` menampilkan dua seri/grafik tren (jarak air & kelembapan) serta switcher rentang waktu.
- [ ] Kondisi data kosong menampilkan empty state yang informatif tanpa crash.

**Verification:**
- [ ] Tests pass: `npm test -- history`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Uji pergantian filter `1 Jam`, `24 Jam`, dan `7 Hari` di browser

**Dependencies:** Task 15

**Files likely touched:**
- `src/app/api/devices/[deviceId]/history/route.ts`
- `src/app/dashboard/devices/[deviceId]/history/page.tsx`
- `src/components/devices/TelemetryChart.tsx`
- `tests/history.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Checkpoint 6: Monitoring, Kontrol & Grafik
- [ ] Latensi kontrol manual dari klik tombol hingga eksekusi ESP32 terukur ≤ 5 detik
- [ ] Grafik `1h`, `24h`, `7d` tampil akurat tanpa error di console browser
- [ ] `npm test` dan `npm run build` lulus

---

## Phase 5: Pusat Notifikasi, Admin & Verifikasi Akhir

### Task 18: Pusat Notifikasi (`/dashboard/alerts`) & Aksi Resolve
**Description:** Membangun API dan halaman `/dashboard/alerts` untuk menampilkan daftar peringatan (`TANK_CRITICAL`, `TANK_LOW`, `MEDIA_DRY`, `DEVICE_OFFLINE`) khusus perangkat milik user yang login, dengan filter status dan tombol **Resolve** untuk menandai selesai.

**Acceptance criteria:**
- [ ] Halaman menampilkan daftar alert milik perangkat user terurut dari terbaru beserta badge keparahan (`CRITICAL` disorot jelas).
- [ ] Menekan **Resolve** memperbarui `resolved: true`, `resolvedAt`, dan `resolvedBy` di MongoDB.
- [ ] User tidak dapat melihat atau me-resolve alert perangkat milik user lain.

**Verification:**
- [ ] Tests pass: `npm test -- alerts-ui`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Picu alert `TANK_LOW` atau `TANK_CRITICAL`, lalu klik **Resolve** di `/dashboard/alerts`

**Dependencies:** Task 10, Task 15

**Files likely touched:**
- `src/app/api/alerts/route.ts`
- `src/app/api/alerts/[alertId]/resolve/route.ts`
- `src/app/dashboard/alerts/page.tsx`
- `src/components/alerts/AlertsList.tsx`
- `tests/alerts.test.ts`

**Estimated scope:** Medium (4–5 files)

---

### Task 19: Deteksi & Alert Otomatis `DEVICE_OFFLINE` (`> 30 detik`)
**Description:** Membuat endpoint terjadwal (mis. `/api/cron/check-offline` untuk Vercel Cron atau pemicu eksternal) yang memeriksa perangkat dengan `lastSeenAt` > 30 detik lalu dan membuat alert `DEVICE_OFFLINE` jika belum ada alert aktif yang belum di-resolve.

**Acceptance criteria:**
- [ ] Endpoint cron dilindungi oleh `CRON_SECRET` agar tidak bisa dipicu sembarangan oleh publik.
- [ ] `CRON_SECRET` divalidasi di `src/lib/env.ts` (Zod) dan tercantum di `.env.example`.
- [ ] Perangkat dengan `lastSeenAt < now - 30s` menghasilkan tepat 1 alert `DEVICE_OFFLINE` aktif (`resolved: false`).
- [ ] Saat perangkat mengirim telemetri lagi, tidak ada spam alert baru selama kondisi online.

**Verification:**
- [ ] Tests pass: `npm test -- offline-cron`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 10, Task 18

**Files likely touched:**
- `src/app/api/cron/check-offline/route.ts`
- `src/lib/env.ts`
- `.env.example`
- `vercel.json`
- `tests/offline-cron.test.ts`

**Estimated scope:** Medium (4–5 files)

---

### Task 20: Panel Administrasi (`ADMIN`)
**Description:** Membangun halaman khusus `ADMIN` (`/dashboard/admin`) beserta API-nya agar pengelola sistem dapat memantau daftar seluruh perangkat terdaftar secara global (beserta pemilik dan status `ONLINE`/`OFFLINE`), melihat daftar akun pengguna, dan memantau ringkasan kesehatan sistem.

**Acceptance criteria:**
- [ ] Akun ber-role `USER` yang mengakses `/dashboard/admin` atau API admin ditolak (`403` / redirect ke `/dashboard`).
- [ ] Akun ber-role `ADMIN` dapat melihat total perangkat online/offline, jumlah alert aktif, seluruh daftar perangkat, dan daftar pengguna (tanpa mengekspos `passwordHash` atau `apiKeyHash`).

**Verification:**
- [ ] Tests pass: `npm test -- admin`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Uji akses dengan akun `USER` (ditolak) dan akun `ADMIN` (berhasil menampilkan data global)

**Dependencies:** Task 5, Task 7, Task 18

**Files likely touched:**
- `src/app/api/admin/overview/route.ts`
- `src/app/dashboard/admin/page.tsx`
- `src/components/admin/AdminOverview.tsx`
- `tests/admin.test.ts`

**Estimated scope:** Medium (3–4 files)

---

### Task 21: Verifikasi End-to-End Kriteria Keberhasilan PRD & Deploy Check
**Description:** Menjalankan audit menyeluruh terhadap 4 *Success Metrics* PRD (isolasi multi-user, keandalan telemetri 10–15s, fail-safe `< 5s`, latensi kontrol `≤ 5s`), memastikan `npm run lint`, `npm test`, `npm run build` bersih, serta memverifikasi konfigurasi deploy Vercel + MongoDB Atlas.

**Acceptance criteria:**
- [ ] Seluruh unit/integration test, linter, dan production build Next.js 16 lulus tanpa error.
- [ ] Bukti uji tercatat untuk ke-4 metrik keberhasilan PRD (isolasi data, telemetri 10–15s, fail-safe `< 5s`, kontrol `≤ 5s`).
- [ ] Environment variables & konfigurasi deploy Vercel terdokumentasi dan terverifikasi.

**Verification:**
- [ ] `npm run lint && npm test && npm run build`
- [ ] Checklist verifikasi manual & hasil uji tersimpan/tercatat

**Dependencies:** Tasks 14, 16, 17, 18, 19, 20

**Files likely touched:**
- `README.md` (update quick start & verification notes jika diperlukan)
- `tasks/todo.md` (centang semua task selesai)

**Estimated scope:** Small (1–2 files)

---

### Checkpoint 7: Production Ready
- [ ] Semua 21 task selesai dan tercentang
- [ ] Tidak ada rahasia/API key/password yang bocor di kode atau response API
- [ ] Siap didemokan ke Dosen Pembimbing (Bu Amelia)
