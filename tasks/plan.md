# Implementation Plan: Sistem Monitoring & Otomasi Hidroponik NFT Kangkung Berbasis IoT

**Basis Dokumen:** PRD v1.1 (Multi-User Clean Build) & `PANDUAN.md`  
**Target Direktori:** `D:\project\smartfarm-iot`  
**Tanggal:** 27 November 2026  

---

## Overview

Membangun ulang (*clean build*) platform IoT *multi-user* untuk monitoring dan otomasi hidroponik NFT kangkung menggunakan **Next.js 16 (App Router, TypeScript strict, Tailwind CSS)**, **MongoDB Atlas (Official Node.js Driver)**, **Zod**, **Auth.js v5**, serta firmware **ESP32 (38-pin)** dengan sensor HC-SR04, Capacitive Soil Moisture v2.0, Relay HL-51 (pompa), dan Servo SG90 (katup nutrisi). Pekerjaan dipecah menjadi 21 task kecil (ukuran S/M) berbasis *vertical slicing* mengikuti urutan ketergantungan (*foundation → auth → device management → IoT API & firmware → dashboard UI → alerts & admin → E2E verification*).

---

## Architecture Decisions

1. **Official MongoDB Driver + Zod (tanpa Mongoose/Prisma):** Sesuai PRD, seluruh query dan skema menggunakan Official MongoDB Node.js Driver yang dipadukan dengan skema validasi Zod di layer boundary (API, Server Actions, env).
2. **Auth.js v5 Credentials Provider dengan Role-Based Session (`USER` | `ADMIN`):** Sesi JWT membawa `userId` dan `role` untuk proteksi middleware `/dashboard/*` dan isolasi kepemilikan (`ownerId`) di setiap query.
3. **Deterministic Hashing untuk Device API Key:** Plain-text `x-api-key` ditampilkan sekali saat *Add Device* atau *Reset API Key*, sedangkan MongoDB menyimpan hash (mis. SHA-256) agar endpoint IoT dapat melakukan lookup cepat sekaligus aman bila database bocor.
4. **Fail-Safe Lokal di ESP32 + Guard di Server:** Evaluasi jarak kritis (`> 25 cm`) dijalankan secara lokal di loop sensor ESP32 (< 5 detik) tanpa bergantung internet, ditambah validasi server agar perintah menyalakan pompa ditolak saat air kritis.
5. **Dual-Loop IoT Polling & Telemetry:** Telemetri dikirim setiap 10–15 detik (`POST /api/iot/telemetry`), sedangkan perintah kontrol di-poll setiap ≤ 5 detik (`GET /api/iot/control`) untuk memenuhi SLA latensi kontrol manual ≤ 5 detik.
6. **Pemisahan Jalur Kontrol IoT vs Web:** `/api/iot/control` (ESP32, `x-api-key`) dan `/api/devices/[deviceId]/control` (web, sesi Auth.js) adalah dua jalur terpisah. Jalur web hanya menulis *desired state* ke `devices`; field `ownerId`, `recordedAt`, dan `waterLevelPct` pada telemetri selalu ditetapkan server, bukan dikirim ESP32.

---

## Dependency Graph

```text
[T1: Init Next.js 16 + Test Setup]
        │
        ▼
[T2: Env Zod + MongoDB Singleton + Indexes]
        │
        ├──► [T3: Register] ──► [T4: Login (Auth.js v5)] ──► [T5: Middleware & RBAC]
        │                                                            │
        │                    ┌───────────────────────────────────────┤
        │                    ▼                                       ▼
        │          [T6: Add Device + API Key]             [T20: Panel Admin]
        │                    │
        │                    ▼
        │          [T7: Device List & Online/Offline] ──► [T8: Reset Key & Delete]
        │                    │
        │        ┌───────────┴──────────────┐
        │        ▼                          ▼
        │  [T9: IoT Telemetry API]    [T11: IoT Control Polling API]
        │        │                          │
        │        ▼                          │
        │  [T10: Auto Alert Evaluator]      │
        │        │                          │
        │        ├──────────────────────────┤
        │        ▼                          ▼
        │  [T12-T14: Firmware ESP32]  [T15-T17: Dashboard, Control & History]
        │                                   │
        └───────────────────────────────────┴──► [T18: Alerts UI] & [T19: Offline Cron]
                                                        │
                                                        ▼
                                            [T21: E2E Verification & Deploy]
```

---

## Task List Ringkas

### Phase 1: Fondasi & Autentikasi
- [x] **Task 1:** Inisialisasi proyek Next.js 16 (TypeScript strict, Tailwind CSS, Vitest/test runner)
- [x] **Task 2:** Setup validasi env (Zod), koneksi singleton MongoDB, dan script pembuatan index
- **Checkpoint 1 (Foundation):** `npm run build` & test env/DB koneksi lulus
- [ ] **Task 3:** Fitur registrasi akun (`/register` + validasi Zod + hash password)
- [ ] **Task 4:** Fitur login & sesi Auth.js v5 (`/login` + Credentials Provider + role session)
- [ ] **Task 5:** Middleware proteksi `/dashboard/*` & helper otorisasi kepemilikan (`USER` vs `ADMIN`)
- **Checkpoint 2 (Auth):** Alur register → login → proteksi rute berjalan normal

### Phase 2: Manajemen Perangkat (Multi-User Isolation)
- [ ] **Task 6:** Fitur *Add Device* (form + API/Action + generate & hash `x-api-key` satu kali)
- [ ] **Task 7:** Daftar perangkat (`/dashboard/devices`) + status `ONLINE`/`OFFLINE` (`> 30 detik`)
- [ ] **Task 8:** Fitur Reset API Key & Hapus Perangkat dengan verifikasi `ownerId`
- **Checkpoint 3 (Devices):** Isolasi perangkat antar dua user teruji

### Phase 3: Backend IoT & Firmware ESP32
- [ ] **Task 9:** Endpoint `POST /api/iot/telemetry` (auth `x-api-key`, validasi Zod, simpan ke `telemetry` & update `devices`)
- [ ] **Task 10:** Service evaluator alert otomatis (`TANK_LOW`, `TANK_CRITICAL`, `MEDIA_DRY`)
- [ ] **Task 11:** Endpoint `GET /api/iot/control` (auth `x-api-key`, kembalikan mode + perintah aktuator + guard fail-safe `> 25 cm`)
- **Checkpoint 4 (IoT Backend):** Contract test endpoint IoT & alert otomatis lulus
- [ ] **Task 12:** Firmware ESP32: Modul pembacaan sensor HC-SR04 (`GPIO 5/18`) & Soil Moisture (`GPIO 34`)
- [ ] **Task 13:** Firmware ESP32: State machine `AUTO` (siklus 5m/10m, backup `< 30%`, servo 3s + cooldown 60s) & *fail-safe* lokal `< 5s` (`> 25 cm`)
- [ ] **Task 14:** Firmware ESP32: Klien HTTPS (`x-api-key`), kirim telemetri 10–15s, polling kontrol ≤ 5s, dan mode `MANUAL`
- **Checkpoint 5 (Hardware-to-Cloud):** Uji prototipe fisik ESP32 kirim data & fail-safe `< 5s`

### Phase 4: Monitoring, Kontrol & Grafik Riwayat
- [ ] **Task 15:** Dashboard ringkasan (`/dashboard`) & detail perangkat (`/dashboard/devices/[deviceId]`) + *Device Switcher*
- [ ] **Task 16:** Panel Kontrol Aktuator (`/dashboard/devices/[deviceId]/control`) — toggle `AUTO`/`MANUAL`, pompa, servo 3 detik
- [ ] **Task 17:** Grafik Riwayat Telemetri (`/dashboard/devices/[deviceId]/history`) — rentang `1 jam`, `24 jam`, `7 hari`
- **Checkpoint 6 (Dashboard & Kontrol):** Latensi kontrol manual ≤ 5 detik & grafik tampil akurat

### Phase 5: Pusat Notifikasi, Panel Admin & Verifikasi Akhir
- [ ] **Task 18:** Pusat Notifikasi (`/dashboard/alerts`) — daftar alert per user & tombol **Resolve**
- [ ] **Task 19:** Deteksi & alert `DEVICE_OFFLINE` (`> 30 detik`) via scheduled endpoint/cron
- [ ] **Task 20:** Panel `ADMIN` (`/dashboard/admin`) — monitoring global perangkat & manajemen user
- [ ] **Task 21:** Uji End-to-End seluruh Success Metrics PRD & deployment check ke Vercel
- **Checkpoint 7 (Release Ready):** Seluruh tes, lint, build, dan verifikasi PRD lulus

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Celah jarak HC-SR04 (`< 5 cm` dan `15–20 cm`) di PRD menyebabkan kondisi *undefined* di state machine | High | Kunci aturan rentang eksplisit di Task 10 & Task 13 sebelum menulis logika (`≤ 20 cm` aman, `< 5 cm` blind spot/penuh) |
| Pembacaan Soil Moisture tidak akurat karena belum dikalibrasi | Med | Pisahkan konstanta `AIR_VALUE` dan `WATER_VALUE` di header konfigurasi firmware (Task 12) |
| Serverless Vercel tidak punya *background worker* untuk `DEVICE_OFFLINE` | Med | Hitung status `OFFLINE` *on-read* di UI/API (Task 7) + buat cron job ringan untuk insert alert `DEVICE_OFFLINE` (Task 19) |
| ESP32 brownout saat Servo SG90 bergerak atau koneksi WiFi 5 GHz gagal | Med | Wajibkan WiFi 2.4 GHz & suplai daya servo stabil sesuai `PANDUAN.md` Bagian 3 |
| Konflik kompatibilitas Next.js 16 (`cacheComponents` / route runtime / server-only di script) | Med | Ikuti pola resmi Next.js 16 (`source-driven-development`) dan jalankan `npm run build` di setiap checkpoint |

---

## Open Questions (Perlu Konfirmasi Sebelum Task 10 / 13 / 15)

1. **Rentang HC-SR04 `15–20 cm` & `< 5 cm`:** Apakah rentang `≤ 20 cm` diperlakukan sebagai Zona Aman penuh, dan jarak `< 5 cm` dianggap tandon penuh (aman)?
2. **Tinggi Fisik Tandon:** Berapa jarak dasar/kosong tandon (`cm`) untuk menghitung `%` kapasitas air di kartu dashboard (Task 15)?
3. ~~**Rute Panel Admin:** Apakah `/dashboard/admin` atau `/admin`?~~ **Terselesaikan:** rute ditetapkan `/dashboard/admin` (konsisten dengan Task 20 di `todo.md` dan `PANDUAN.md` Bagian 7).

---

## Keputusan Terjawab (27 Nov 2026)

| ID | Keputusan | Alasan / Konsekuensi |
|---|---|---|
| **D4** | **`bcryptjs`** (cost ≥ 12) untuk hash password. | Pure JS, tanpa kompilasi native, aman untuk build serverless Vercel. `argon2` ditolak karena risiko build native. |
| **D11** | **Unit test + mock/inject** untuk kode yang menyentuh MongoDB (tanpa `mongodb-memory-server`, tanpa database test terpisah). Verifikasi nyata dilakukan manual via `scripts/ensure-indexes.ts`. | Menghindari dependency baru dan risiko salah sasaran ke cluster. Strategi integration test nyata (jika dibutuhkan) ditinjau ulang saat Task 9/10. |

Masih terbuka: **D1, D2, D3, D5, D6, D8, D9, D10** (memblokir T10, T11, T13, T15, T16, T17, T19, T20, T21).

