# Panduan Lengkap Sistem Monitoring & Otomasi Hidroponik NFT Kangkung Berbasis IoT

**Versi Dokumen:** 1.1 (Multi-User Clean Build)  
**Tanggal:** 27 November 2026  
**Pengembang:** Wildan Silki Sawabiqil Abroor (Sistem Informasi – UISI)  
**Dosen Pembimbing / Pemangku Kepentingan:** Bu Amelia (UISI)  

---

## Daftar Isi

1. [Ringkasan Sistem & Sasaran Keberhasilan](#1-ringkasan-sistem--sasaran-keberhasilan)
2. [Arsitektur Sistem & Tech Stack](#2-arsitektur-sistem--tech-stack)
3. [Panduan Perangkat Keras (Hardware) & Wiring ESP32](#3-panduan-perangkat-keras-hardware--wiring-esp32)
4. [Logika Otomasi & State Machine](#4-logika-otomasi--state-machine)
5. [Panduan Desain Basis Data (MongoDB Atlas)](#5-panduan-desain-basis-data-mongodb-atlas)
6. [Panduan API Contract & Keamanan](#6-panduan-api-contract--keamanan)
7. [Panduan Struktur Halaman & Fitur Web (Next.js 16)](#7-panduan-struktur-halaman--fitur-web-nextjs-16)
8. [Panduan Setup & Tahapan Pengembangan (Clean Build)](#8-panduan-setup--tahapan-pengembangan-clean-build)
9. [Panduan Pengguna (User Manual)](#9-panduan-pengguna-user-manual)
10. [Panduan Troubleshooting & Pemeliharaan](#10-panduan-troubleshooting--pemeliharaan)
11. [Catatan Klarifikasi & Celah Spesifikasi PRD](#11-catatan-klarifikasi--celah-spesifikasi-prd)

---

## 1. Ringkasan Sistem & Sasaran Keberhasilan

### 1.1 Gambaran Umum
Sistem ini adalah platform IoT *multi-user* untuk memantau dan mengotomatiskan budidaya hidroponik *Nutrient Film Technique* (NFT) tanaman kangkung. Pengguna dapat mendaftarkan perangkat **ESP32** milik mereka sendiri ke **Web Dashboard (Next.js 16 + MongoDB)**, memantau ketinggian air tandon serta kelembapan media tanam secara *real-time*, mengotomatiskan siklus pompa sirkulasi dan katup dispenser nutrisi, serta melakukan kendali jarak jauh.

### 1.2 Masalah yang Diselesaikan
- Mencegah pompa air terbakar (*dry run*) akibat air tandon habis tanpa terdeteksi.
- Mencegah tanaman kangkung layu akibat terhentinya sirkulasi nutrisi atau media tanam (rockwool/spons) mengering.
- Mendukung banyak akun pengguna (*multi-user*) dengan isolasi data perangkat yang aman.

### 1.3 Sasaran Keberhasilan (Success Metrics)
| Indikator | Target |
|---|---|
| **Isolasi Data Pengguna** | Setiap akun `USER` hanya dapat melihat, mengontrol, dan menerima peringatan dari perangkat miliknya sendiri. |
| **Keandalan Telemetri** | Data sensor terkirim dari ESP32 dan tersimpan ke MongoDB secara stabil setiap **10–15 detik**. |
| **Keamanan Aktuator (Fail-Safe)** | Pompa dimatikan paksa dalam waktu **< 5 detik** setelah jarak permukaan air melewati batas kritis (`> 25 cm`). |
| **Latensi Kontrol Manual** | Perintah dari web dashboard dieksekusi oleh ESP32 maksimal dalam 1 siklus *polling* (**≤ 5 detik**). |

---

## 2. Arsitektur Sistem & Tech Stack

### 2.1 Alur Data End-to-End
```text
[Sensor HC-SR04 & Capacitive Soil Moisture v2.0]
                      │
                      ▼
                   [ESP32]
      (Pembacaan sensor + Fail-Safe lokal + Eksekusi aktuator)
                      │
      (WiFi / HTTPS + header x-api-key)
       ├── Telemetri: setiap 10–15 detik
       └── Polling perintah kontrol: setiap ≤ 5 detik
                      │
                      ▼
       [Next.js 16 API Routes (Vercel)]
      (Validasi Zod + Verifikasi Hash API Key + Auth.js v5)
                      │
                      ▼
               [MongoDB Atlas]
     (users, devices, telemetry, alerts)
                      │
                      ▼
         [Multi-User Web Dashboard]
```

### 2.2 Tech Stack Aplikasi Web
| Komponen | Teknologi | Fungsi |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Server Actions & Route Handlers) | Antarmuka web, SSR/RSC, dan API backend IoT |
| **Bahasa** | TypeScript (Strict Mode) | Keamanan tipe data menyeluruh |
| **Styling** | Tailwind CSS | Antarmuka responsif dan konsisten |
| **Database** | MongoDB (Official Node.js Driver) | Penyimpanan akun, perangkat, telemetri, dan peringatan |
| **Validasi Skema** | Zod | Validasi payload API, input form, dan *environment variables* |
| **Autentikasi** | Auth.js v5 (Credentials Provider) | Login/registrasi berbasis sesi & kontrol peran (`USER` / `ADMIN`) |
| **Deployment** | Vercel + MongoDB Atlas | Hosting aplikasi web dan basis data cloud |

---

## 3. Panduan Perangkat Keras (Hardware) & Wiring ESP32

### 3.1 Daftar Komponen & Pemetaan Pin (Pinout)
Mengacu pada komponen fisik aktual prototipe dengan **ESP32 DevKitC / WROOM-32 (38-pin, USB-C)**:

| Komponen Fisik | Model / Spesifikasi | Pin ESP32 | Fungsi & Catatan Teknis |
|---|---|---|---|
| **Mikrokontroler** | ESP32 DevKitC / WROOM-32 (38-pin, USB-C) | — | Unit pemroses utama & konektivitas WiFi 2.4 GHz (ESP32 tidak mendukung WiFi 5 GHz). |
| **Sensor Level Air** | Ultrasonik HC-SR04 | `GPIO 5` (`TRIG`)<br>`GPIO 18` (`ECHO`) | Mengukur jarak dari tutup tandon ke permukaan air (*non-contact*). **Wajib** memasang *voltage divider* (`1kΩ` & `2kΩ`) pada jalur `ECHO` (`5V → 3.3V`). |
| **Sensor Kelembapan** | Capacitive Soil Moisture Sensor v2.0 | `GPIO 34` (`ADC1_CH6`) | Membaca kelembapan media tanam (rockwool/spons) secara analog (`0–4095` dikonversi ke `0–100%`). |
| **Aktuator Pompa** | 1-Channel Relay HL-51 V1.0 (`JQC3F-03VDC-C`) + Mini Pompa DC | `GPIO 26` (`Digital OUT`) | Memutus/menyambung arus ke pompa *submersible*. Relay trigger `3V` kompatibel langsung dengan logika `3.3V` ESP32. |
| **Aktuator Katup Nutrisi** | Tower Pro SG90 Micro Servo (9g) | `GPIO 25` (`PWM`) | Memutar tuas buka (`90°`) dan tutup (`0°`) lubang dispenser larutan nutrisi pekat ke tandon. |

### 3.2 Skema Voltage Divider Jalur ECHO (Wajib)
Sensor HC-SR04 bekerja pada tegangan `5V` dan mengeluarkan sinyal `ECHO` sebesar `5V`, sedangkan pin GPIO ESP32 hanya toleran terhadap `3.3V`. Hubungkan rangkaian pembagi tegangan berikut sebelum masuk ke `GPIO 18`:

```text
HC-SR04 ECHO (5V) ──[ R1: 1 kΩ ]──┬──► ESP32 GPIO 18 (~3.33V)
                                   │
                             [ R2: 2 kΩ ]
                                   │
                                  GND
```

### 3.3 Catatan Penting Kelistrikan & Kalibrasi Hardware
1. **Gunakan Pin ADC1 untuk Soil Moisture:** `GPIO 34` berada pada `ADC1_CH6` sehingga tetap dapat membaca nilai analog dengan normal saat WiFi ESP32 aktif (pin `ADC2` akan bentrok dengan WiFi). Selain itu `GPIO 34` bersifat *input-only*, cocok untuk sensor.
2. **Ground Bersama (Common Ground):** Pastikan jalur `GND` dari ESP32, HC-SR04, Soil Moisture Sensor, modul Relay, Servo SG90, dan catu daya eksternal (jika dipakai) terhubung pada satu titik referensi `GND` yang sama.
3. **Catu Daya Servo & Pompa:** Mini Pompa DC tidak boleh ditenagai langsung dari pin `3.3V`/`5V` ESP32; gunakan sumber daya DC terpisah melalui kontak `COM`/`NO` pada Relay HL-51. Untuk SG90, pastikan suplai `5V` cukup stabil agar ESP32 tidak mengalami *brownout reset* saat servo bergerak.
4. **Kalibrasi Soil Moisture (0–100%):** Lakukan pembacaan nilai mentah ADC (`0–4095`) dalam dua kondisi:
   - Kondisi **kering di udara / media kering** → jadikan batas `0%` (`AIR_VALUE`).
   - Kondisi **basah / tercelup penuh di air** → jadikan batas `100%` (`WATER_VALUE`).
   - Gunakan pemetaan linear terbalik (*inverse mapping*) karena pada Capacitive Soil Moisture v2.0 nilai tegangan/ADC umumnya **turun** saat media semakin basah.

---

## 4. Logika Otomasi & State Machine

Setiap perangkat memiliki dua mode operasi: **`AUTO`** (otomatis penuh) dan **`MANUAL`** (*override* dari web dashboard).

### 4.1 Tabel Zona Level Air Tandon (Pembacaan HC-SR04)
Jarak diukur dari sensor di tutup tandon menuju permukaan air (semakin **besar** jarak cm, semakin **rendah** volume air):

| Zona | Jarak HC-SR04 | Perilaku di Mode `AUTO` | Perilaku di Mode `MANUAL` | Alert Backend |
|---|---|---|---|---|
| **Zona Aman** | `5 cm – 15 cm` | Pompa mengikuti siklus sirkulasi normal (`ON` 5 mnt / `OFF` 10 mnt). | Mengikuti perintah manual user. | — |
| **Zona Waspada / Isi Nutrisi** | `> 20 cm` hingga `25 cm` | Servo SG90 buka (`90°`) selama **3 detik** lalu tutup (`0°`), dilanjutkan **cooldown 60 detik** sebelum evaluasi ulang. Pompa tetap diizinkan berjalan (`≤ 25 cm`). | Mengikuti perintah manual user (tidak menjalankan dosis servo otomatis). | `TANK_LOW` |
| **Zona Kritis (Fail-Safe)** | `> 25 cm` | **PRIORITAS TERTINGGI:** Relay Pompa dipaksa `OFF` segera (`< 5 detik`). | **PRIORITAS TERTINGGI:** Tetap memaksa Relay Pompa `OFF` (mengabaikan override `MANUAL`). | `TANK_CRITICAL` (`CRITICAL`) |

> **Penting:** Pengecekan kondisi **Zona Kritis (`> 25 cm`)** wajib dievaluasi secara lokal langsung di firmware ESP32 setiap siklus pembacaan sensor (misalnya tiap 1–2 detik), bukan menunggu perintah dari server. Hal ini menjamin pompa mati dalam `< 5 detik` meskipun internet sedang terputus.

### 4.2 Siklus Sirkulasi Pompa (Mode `AUTO`)
Berlaku selama level air tidak kritis (`≤ 25 cm`):
1. **Fase Sirkulasi:** Pompa `ON` selama **5 menit**.
2. **Fase Istirahat:** Pompa `OFF` selama **10 menit** (sisa air di talang NFT mengalir kembali ke tandon secara gravitasi).
3. **Pengecualian Hidrasi Media (Backup):** Jika saat **Fase Istirahat** nilai kelembapan media turun ke `< 30%` dan level air tandon aman (`≤ 25 cm`), pompa dipicu menyala selama **2 menit**, lalu kembali ke fase istirahat. Backend juga mencatat peringatan `MEDIA_DRY`.

### 4.3 Diagram Transisi State (Ringkas)
```text
                    [Jarak > 25 cm (ANY MODE)]
         ┌──────────────────────────────────────────────┐
         ▼                                              │
  [FAIL-SAFE: POMPA OFF]                                │
   (Log TANK_CRITICAL)                                  │
         │                                              │
         │ (Air diisi ulang hingga ≤ 25 cm)             │
         ▼                                              │
   ┌─[Mode?]──────────────────────────────────────┐     │
   │                                              │     │
   ▼ (AUTO)                                       ▼ (MANUAL)
[Cek Level Air]                            [Ikuti Perintah User]
 ├─ 5–15 cm  ──► Siklus 5m ON / 10m OFF     ├─ Pompa ON/OFF
 └─ >20–25cm ──► Servo 90° (3s) → 0°        └─ Servo Buka (3s)
                 + Cooldown 60s + TANK_LOW
                 (Selama ≤25cm: siklus tetap jalan)
```

---

## 5. Panduan Desain Basis Data (MongoDB Atlas)

Seluruh query pada database dijalankan menggunakan **Official MongoDB Node.js Driver** dengan validasi input **Zod**. Untuk menjamin **isolasi data multi-user**, seluruh akses koleksi `devices`, `telemetry`, dan `alerts` oleh `USER` wajib menyertakan filter kepemilikan (`ownerId`).

### 5.1 Koleksi yang Dibutuhkan
| Koleksi | Tujuan | Field Kunci yang Disarankan | Index Penting |
|---|---|---|---|
| `users` | Data akun pengguna dan peran (`USER` / `ADMIN`). | `_id`, `name`, `email`, `passwordHash`, `role`, `createdAt` | `email` (unique) |
| `devices` | Data unit ESP32 terdaftar, kepemilikan, kredensial hash, dan state kontrol terbaru. | `_id`, `deviceId`, `ownerId` (ref `users._id`), `name`, `macAddress`, `apiKeyHash`, `mode` (`AUTO` \| `MANUAL`), `desiredPumpState`, `desiredServoTriggerAt`, `lastWaterDistanceCm`, `lastSoilMoisturePct`, `lastPumpState`, `lastServoState`, `lastSeenAt`, `createdAt` | `deviceId` (unique), `ownerId`, `apiKeyHash` (unique), `macAddress` |
| `telemetry` | Riwayat pembacaan sensor dan status aktuator untuk grafik (`1 jam`, `24 jam`, `7 hari`). | `_id`, `deviceId`, `ownerId`, `waterDistanceCm`, `waterLevelPct`, `soilMoisturePct`, `pumpState`, `servoState`, `mode`, `recordedAt` | Compound index `{ deviceId: 1, recordedAt: -1 }` |
| `alerts` | Log peringatan otomatis dan status penyelesaian (*Resolve*). | `_id`, `deviceId`, `ownerId`, `type` (`TANK_CRITICAL` \| `TANK_LOW` \| `MEDIA_DRY` \| `DEVICE_OFFLINE`), `severity` (`INFO` \| `WARNING` \| `CRITICAL`), `message`, `resolved`, `resolvedAt`, `resolvedBy`, `createdAt` | `{ ownerId: 1, resolved: 1, createdAt: -1 }`, `{ deviceId: 1, type: 1, resolved: 1 }` |

### 5.2 Kebijakan Keamanan Device API Key
- Saat pengguna membuat perangkat baru (*Add Device*) atau melakukan *Reset API Key*, sistem membuat token acak berkekuatan kriptografis (misalnya `32 byte` hex/base64url).
- **Plain-text API Key hanya ditampilkan satu kali** di UI pada saat pembuatan/reset agar pengguna dapat menyalinnya ke firmware ESP32.
- Di MongoDB, hanya **nilai hash** (`SHA-256` atau hash deterministik lain agar dapat di-lookup dengan cepat oleh endpoint IoT) yang disimpan pada field `apiKeyHash`.

---

## 6. Panduan API Contract & Keamanan

### 6.1 Pemisahan Jalur Autentikasi
1. **Jalur Pengguna Web (`/dashboard/*` & API Internal):**
   - Dilindungi oleh **Auth.js v5** (session cookie + middleware proteksi rute `/dashboard/*`).
   - Role `USER`: hanya bisa mengakses/mengubah resource dengan `ownerId === session.user.id`.
   - Role `ADMIN`: dapat mengakses monitoring global seluruh perangkat dan manajemen akun pengguna.
2. **Jalur Perangkat ESP32 (`/api/iot/*`):**
   - Menggunakan header HTTP `x-api-key` melalui **HTTPS**.
   - Server melakukan hashing terhadap `x-api-key` yang masuk lalu mencocokkannya dengan `devices.apiKeyHash`.
   - Payload request divalidasi ketat dengan **Zod** sebelum diproses.

### 6.2 Kebutuhan Endpoint Utama
| Jenis | Arah Komunikasi | Fungsi | Interval / SLA |
|---|---|---|---|
| **Kirim Telemetri** | `ESP32 → Server` | Mengirim jarak air (`cm`), kelembapan media (`%`), status aktual pompa & servo, serta mode berjalan. Server memperbarui `lastSeenAt`, menyimpan ke `telemetry`, dan mengevaluasi aturan `alerts` (`TANK_LOW`, `TANK_CRITICAL`, `MEDIA_DRY`). | Setiap **10–15 detik** |
| **Polling Perintah Kontrol** | `ESP32 → Server` | Mengambil konfigurasi/perintah terbaru dari dashboard (`mode`: `AUTO`/`MANUAL`, target pompa `ON`/`OFF`, pemicu buka servo 3 detik). | Maksimal setiap **≤ 5 detik** |
| **Manajemen Device** | `Web → Server` | Tambah perangkat (*Add Device*), lihat daftar perangkat & status `ONLINE`/`OFFLINE` (`lastSeenAt > 30 detik` = `OFFLINE`), reset API key, hapus perangkat. | On-demand |
| **Kontrol Aktuator** | `Web → Server` | Mengubah `AUTO`/`MANUAL`, toggle pompa saat `MANUAL`, dan memicu dispenser nutrisi 3 detik saat `MANUAL`. (Server wajib menolak perintah menyalakan pompa jika status air terakhir `> 25 cm`). | On-demand |
| **Riwayat & Alerts** | `Web → Server` | Query data `telemetry` berdasarkan rentang waktu (`1h`, `24h`, `7d`) dan menampilkan/menandai `Resolve` pada `alerts`. | On-demand |

> **Catatan penamaan jalur kontrol:** Terdapat dua jalur "kontrol" yang berbeda dan tidak boleh tertukar atau digabung: `GET /api/iot/control` (khusus ESP32, autentikasi `x-api-key`, polling `≤ 5 detik`) dan `/api/devices/[deviceId]/control` (khusus web, autentikasi sesi Auth.js). Jalur web hanya menulis *desired state* ke koleksi `devices` (mis. `mode`, `desiredPumpState`, `desiredServoTriggerAt`); ESP32 mengambilnya melalui jalur IoT.
>
> **Field yang ditetapkan server (bukan dikirim ESP32):** `ownerId` (diturunkan dari perangkat yang terautentikasi), `recordedAt` (UTC), dan `waterLevelPct` (dihitung server; rumus mengikuti keputusan tinggi tandon pada Bagian 11 poin 2). ESP32 hanya mengirim `waterDistanceCm`, `soilMoisturePct`, `pumpState`, `servoState`, dan `mode`.

---

## 7. Panduan Struktur Halaman & Fitur Web (Next.js 16)

| Rute Halaman | Akses | Fitur Wajib Sesuai PRD |
|---|---|---|
| `/login` & `/register` | Publik (redirect ke `/dashboard` jika sudah login) | Registrasi akun baru dan login dengan Auth.js v5 (Credentials Provider). |
| `/dashboard` | `USER`, `ADMIN` | Ringkasan dashboard & *device switcher* untuk pengguna yang memiliki > 1 unit hidroponik. |
| `/dashboard/devices` | `USER`, `ADMIN` | Form *Add Device* (Nama, ID Perangkat/auto-generate, MAC Address), tampilan *one-time API Key*, daftar perangkat dengan badge `ONLINE` / `OFFLINE` (threshold `> 30 detik`), serta tombol **Reset API Key** & **Hapus**. |
| `/dashboard/devices/[deviceId]` | Pemilik perangkat / `ADMIN` | Kartu metrik real-time: Ketinggian air tandon (`cm` & `%` kapasitas), Kelembapan media (`%`), Status Pompa (`ON`/`OFF`), Status Servo (`TERBUKA`/`TERTUTUP`), dan Mode (`AUTO`/`MANUAL`). |
| `/dashboard/devices/[deviceId]/control` | Pemilik perangkat / `ADMIN` | Toggle switch `AUTO` / `MANUAL`. Saat mode `MANUAL` aktif: tombol **Nyalakan/Matikan Pompa** dan **Buka Dispenser Nutrisi (3 Detik)**. |
| `/dashboard/devices/[deviceId]/history` | Pemilik perangkat / `ADMIN` | Grafik tren jarak permukaan air dan persentase kelembapan media untuk rentang **1 jam terakhir**, **24 jam**, dan **7 hari**. |
| `/dashboard/alerts` | `USER`, `ADMIN` | Daftar riwayat peringatan (`TANK_CRITICAL`, `TANK_LOW`, `MEDIA_DRY`, `DEVICE_OFFLINE`) milik perangkat user dengan tombol **Resolve**. |
| Panel Admin (`/dashboard/admin`) | `ADMIN` | Memantau seluruh perangkat terdaftar di platform, mengelola daftar akun pengguna, dan memantau kesehatan sistem global. |

---

## 8. Panduan Setup & Tahapan Pengembangan (Clean Build)

### 8.1 Prasyarat Lingkungan
- **Node.js** versi LTS yang kompatibel dengan Next.js 16
- **MongoDB Atlas** cluster aktif beserta *connection string* (`MONGODB_URI`)
- **Akun Vercel** (untuk deployment Next.js 16)
- **Arduino IDE** atau **PlatformIO** dengan board support `ESP32` dan library servo (`ESP32Servo`) serta HTTP/JSON (`ArduinoJson`)

### 8.2 Contoh Variabel Environment (`.env.local`)
Seluruh variabel environment harus divalidasi saat startup menggunakan **Zod** agar aplikasi gagal lebih awal (*fail-fast*) jika ada konfigurasi yang hilang:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartfarm?retryWrites=true&w=majority
MONGODB_DB_NAME=smartfarm_iot

# Auth.js v5
AUTH_SECRET=<random-secret-minimal-32-karakter>
AUTH_URL=http://localhost:3000

# Opsional: Seed Admin Awal
ADMIN_EMAIL=admin@example.com

# Endpoint terjadwal (Task 19): melindungi /api/cron/check-offline
CRON_SECRET=<random-secret-minimal-32-karakter>
```

> **Peringatan Keamanan:** Jangan pernah melakukan *commit* file `.env` atau `.env.local` ke Git. Gunakan environment variables dashboard pada Vercel untuk staging/production.

### 8.3 Urutan Implementasi Clean Build (Incremental Slices)
Untuk menjaga stabilitas pengembangan dari repository kosong (*clean build*), kerjakan bertahap sesuai urutan ketergantungan:

1. **Slice 1 — Fondasi Proyek & Database:**
   - Inisialisasi Next.js 16 (TypeScript strict, Tailwind CSS, App Router).
   - Setup validasi env dengan Zod dan koneksi singleton MongoDB Official Driver + script pembuatan index.
2. **Slice 2 — Autentikasi & RBAC:**
   - Konfigurasi Auth.js v5 (Credentials Provider, password hashing, session callback menyertakan `id` dan `role`).
   - Buat halaman `/login` dan `/register` serta middleware proteksi `/dashboard/*`.
3. **Slice 3 — Manajemen Perangkat (`/dashboard/devices`):**
   - Implementasi *Add Device* (auto-generate `deviceId` opsional, validasi format MAC Address dengan Zod, generate & hash `x-api-key`, tampilkan key 1 kali).
   - Implementasi daftar perangkat, kalkulasi `ONLINE`/`OFFLINE` (`> 30 detik`), reset API key, dan hapus perangkat dengan verifikasi kepemilikan.
4. **Slice 4 — API IoT & Firmware ESP32:**
   - Buat Route Handler pengiriman telemetri (10–15 detik) dan polling kontrol (≤ 5 detik) yang diautentikasi dengan `x-api-key`.
   - Implementasikan firmware ESP32: pembacaan HC-SR04 + Soil Moisture, *fail-safe* lokal (`> 25 cm`), state machine mode `AUTO` (siklus 5m/10m, backup 2m jika `< 30%`, servo 3s + cooldown 60s), dan eksekusi perintah `MANUAL`.
5. **Slice 5 — Monitoring, Kontrol & Grafik Riwayat:**
   - Bangun halaman `/dashboard`, `/dashboard/devices/[deviceId]`, `/control`, dan `/history` (filter `1h`, `24h`, `7d`).
6. **Slice 6 — Pusat Notifikasi & Panel Admin:**
   - Implementasi pembuatan alert otomatis (`TANK_CRITICAL`, `TANK_LOW`, `MEDIA_DRY`, `DEVICE_OFFLINE`) + tombol *Resolve* di `/dashboard/alerts`.
   - Bangun panel `ADMIN` untuk pemantauan global perangkat dan manajemen pengguna.
7. **Slice 7 — Verifikasi End-to-End Terhadap Kriteria Keberhasilan:**
   - Uji isolasi data antar dua akun `USER` berbeda (pastikan ID perangkat user A tidak bisa diakses/dikontrol user B).
   - Uji *fail-safe* dengan mengangkat sensor HC-SR04 > 25 cm dari permukaan air dan ukur waktu mati pompa (< 5 detik).
   - Uji latensi perintah `MANUAL` dari dashboard hingga aktuator merespons (≤ 5 detik).

---

## 9. Panduan Pengguna (User Manual)

Bagian ini ditujukan bagi pengguna akhir / pengelola kebun hidroponik NFT kangkung.

### Langkah 1: Registrasi & Masuk ke Aplikasi
1. Buka alamat Web Dashboard melalui browser.
2. Pilih menu **Register** (`/register`), lalu isi nama, email, dan password Anda.
3. Masuk menggunakan akun yang telah dibuat pada halaman **Login** (`/login`).

### Langkah 2: Mendaftarkan Perangkat Hidroponik (Add Device)
1. Buka menu **Perangkat** (`/dashboard/devices`).
2. Klik tombol **Add Device**, lalu isi:
   - **Nama Perangkat** (contoh: *Rak Kangkung 1*)
   - **ID Perangkat** (isi manual atau biarkan *auto-generate*)
   - **MAC Address ESP32** (format standar mis. `AA:BB:CC:DD:EE:FF`)
3. Simpan perangkat. Sistem akan menampilkan **Device API Key** sebanyak **satu kali saja**.
4. **Segera salin dan simpan API Key tersebut.** Jika hilang atau lupa, gunakan fitur **Reset API Key** di daftar perangkat untuk membuat kunci baru (kunci lama akan otomatis tidak berlaku).

### Langkah 3: Konfigurasi & Pemasangan Perangkat Keras
1. Pastikan rangkaian sensor HC-SR04 (dengan *voltage divider* `1kΩ` & `2kΩ` di pin `ECHO`), Soil Moisture v2.0, Relay pompa, dan Servo SG90 sudah terpasang sesuai [Bagian 3](#3-panduan-perangkat-keras-hardware--wiring-esp32).
2. Masukkan kredensial WiFi (2.4 GHz), URL server web, dan **Device API Key** ke konfigurasi firmware ESP32, lalu unggah (*upload*) ke papan ESP32.
3. Nyalakan perangkat. Dalam beberapa detik, status perangkat di `/dashboard/devices` akan berubah dari `OFFLINE` menjadi **`ONLINE`**.

### Langkah 4: Memantau Kondisi Real-Time & Riwayat
1. Buka **Dashboard Monitoring** (`/dashboard` atau `/dashboard/devices/[deviceId]`).
2. Jika Anda memiliki lebih dari satu rak/perangkat, gunakan **Device Switcher** untuk berpindah antar perangkat.
3. Perhatikan 5 metrik utama:
   - **Ketinggian Air Tandon** (`cm` jarak ke permukaan & `%` kapasitas)
   - **Kelembapan Media Tanam** (`%`)
   - **Status Pompa** (`ON` / `OFF`)
   - **Status Servo Dispenser** (`TERBUKA` / `TERTUTUP`)
   - **Mode Operasi** (`AUTO` / `MANUAL`)
4. Untuk melihat grafik perubahan data dari waktu ke waktu, buka tab **History** (`/dashboard/devices/[deviceId]/history`) dan pilih rentang **1 Jam**, **24 Jam**, atau **7 Hari**.

### Langkah 5: Mengatur Mode & Kontrol Jarak Jauh
1. Buka halaman **Kontrol Aktuator** (`/dashboard/devices/[deviceId]/control`).
2. **Mode `AUTO` (Direkomendasikan untuk harian):** Sistem menjalankan sirkulasi pompa 5 menit nyala / 10 menit mati, menyalakan pompa 2 menit jika media kering (`< 30%`), dan meneteskan nutrisi otomatis jika air mulai turun ke zona waspada (`> 20–25 cm`).
3. **Mode `MANUAL` (Untuk perawatan/pengecekan):**
   - Geser toggle mode ke **`MANUAL`**.
   - Gunakan tombol **Nyalakan/Matikan Pompa** atau **Buka Dispenser Nutrisi (3 Detik)** sesuai kebutuhan.
   - Tunggu maksimal **5 detik** hingga ESP32 mengeksekusi perintah.
   - *Catatan keselamatan:* Anda tidak dapat menyalakan pompa jika air tandon berada pada kondisi kritis (`> 25 cm`).

### Langkah 6: Menangani Notifikasi Peringatan (Alerts)
Buka menu **Notifikasi / Alerts** (`/dashboard/alerts`) secara berkala. Jika muncul peringatan, lakukan tindakan berikut sebelum menekan tombol **Resolve**:

| Jenis Alert | Penyebab | Tindakan yang Harus Dilakukan |
|---|---|---|
| `TANK_CRITICAL` *(CRITICAL)* | Jarak air `> 25 cm` (tandon hampir habis; pompa dimatikan paksa). | **Segera isi ulang air & nutrisi tandon** hingga jarak kembali di zona aman (`5–15 cm`), pastikan pompa kembali normal, lalu klik **Resolve**. |
| `TANK_LOW` | Jarak air `> 20 cm` hingga `25 cm` (memasuki zona waspada). | Periksa stok air tandon dan larutan nutrisi di dispenser servo, tambahkan air bila perlu, lalu klik **Resolve**. |
| `MEDIA_DRY` | Kelembapan media tanam `< 30%` saat fase istirahat. | Pastikan aliran air di talang NFT tidak tersumbat dan rockwool menerima aliran air saat siklus pompa berjalan, lalu klik **Resolve**. |
| `DEVICE_OFFLINE` | ESP32 tidak mengirim sinyal/heartbeat lebih dari `30 detik`. | Periksa adaptor daya ESP32 dan koneksi router WiFi 2.4 GHz di lokasi hidroponik, lalu klik **Resolve** setelah perangkat kembali `ONLINE`. |

---

## 10. Panduan Troubleshooting & Pemeliharaan

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Status perangkat selalu `OFFLINE` di web | WiFi 5 GHz dipakai (ESP32 hanya support 2.4 GHz), `x-api-key` salah/lama, atau URL server keliru. | Periksa serial monitor ESP32; pastikan WiFi 2.4 GHz, cek status HTTP response (`401` berarti API key tidak cocok → lakukan Reset API Key). |
| Pembacaan HC-SR04 tidak stabil / `0 cm` / melompat | Kondensasi uap air pada sensor, kabel *loose*, atau *voltage divider* salah nilai. | Pastikan resistor `1kΩ` dan `2kΩ` terpasang benar di jalur `ECHO`, pasang sensor tegak lurus menghadap permukaan air bebas gelombang/pantulan dinding tandon. |
| Pompa tidak menyala meski perintah `ON` dikirim | Air tandon berada di zona kritis (`> 25 cm`) sehingga tertahan *fail-safe*, atau suplai pompa/relay terputus. | Cek pembacaan jarak air di dashboard; jika aman (`≤ 25 cm`), periksa kabel daya DC pompa dan terminal `NO`/`COM` pada Relay HL-51. |
| ESP32 sering restart saat Servo SG90 bergerak | Lonjakan arus servo membebani regulator `5V`/`3.3V` ESP32. | Beri catu daya `5V` yang memadai untuk Servo SG90 dengan `GND` terhubung bersama ke ESP32. |
| Soil moisture selalu `0%` atau `100%` | Belum dikalibrasi atau pin bukan `ADC1`. | Pastikan kabel sinyal masuk ke `GPIO 34` dan sesuaikan nilai batas kalibrasi kering (`0%`) serta basah (`100%`) di firmware. |

---

## 11. Catatan Klarifikasi & Celah Spesifikasi PRD

Selama penyusunan panduan berdasarkan PRD v1.1, terdapat beberapa poin teknis yang perlu diputuskan/dikonfirmasi sebelum kode produksi dikunci:

1. **Celah Rentang Jarak HC-SR04 (`< 5 cm` dan `> 15 cm hingga ≤ 20 cm`):**
   - PRD Bagian 3.1 mendefinisikan **Zona Aman** sebagai `5 cm – 15 cm` dan **Zona Waspada** sebagai `> 20 cm hingga 25 cm`, sementara Bagian 3.2 menyebut pompa berjalan periodik selama `≤ 25 cm`.
   - **Rekomendasi implementasi:** Pastikan state machine menetapkan perilaku eksplisit untuk rentang **`≤ 20 cm`** (perlakukan sebagai zona aman/normal atau tetapkan batas atas Zona Aman secara konsisten di `20 cm`) dan tangani jarak **`< 5 cm`** sebagai kondisi tandon penuh / *blind spot* sensor ultrasonik agar tidak memicu kondisi tak terdefinisi.
2. **Rumus Persentase Kapasitas Air Tandon (`%`):**
   - Dashboard menampilkan ketinggian air dalam `cm` dan `%` kapasitas, namun dimensi tinggi/kedalaman fisik tandon (`TANK_EMPTY_CM` dan `TANK_FULL_CM`) belum tercantum di PRD.
   - **Rekomendasi implementasi:** Jadikan tinggi tandon penuh (`5 cm`) dan batas dasar/kosong (mis. `30 cm` atau sesuai fisik tandon aktual) sebagai konstanta konfigurasi/setting per perangkat agar persentase kapasitas akurat.
3. **Deteksi `DEVICE_OFFLINE` (> 30 detik) di Lingkungan Serverless (Vercel):**
   - Karena Vercel menggunakan *serverless functions* yang tidak menjalankan proses *background loop* terus-menerus, status `OFFLINE` dapat dihitung secara langsung (*on-read*) dari `now - lastSeenAt > 30s`, sedangkan pembuatan log alert `DEVICE_OFFLINE` ke koleksi `alerts` perlu dipicu oleh *scheduled cron job* (mis. Vercel Cron) atau pengecekan berkala.
4. **Rute Spesifik Panel `ADMIN` (Terselesaikan):**
   - PRD menjelaskan peran `ADMIN` namun belum menetapkan path URL. Implementasi menetapkan **`/dashboard/admin`** (konsisten dengan Task 20 di `tasks/todo.md`). Rute dilindungi pengecekan `session.user.role === 'ADMIN'` di `proxy.ts` (atau `middleware.ts` sesuai versi Next.js terpasang) serta di setiap Server Action / Route Handler terkait.
