# SmartFarm IoT — Hidroponik

Sistem monitoring dan otomatisasi hidroponik berbasis ESP32, Next.js, dan MongoDB Atlas.

## Stack

- **Frontend & Backend:** Next.js 16 (App Router) + TypeScript
- **Database:** MongoDB Atlas
- **Auth:** Auth.js v5 (Credentials + JWT)
- **Validasi:** Zod
- **Styling:** Tailwind CSS
- **Device:** ESP32 + fleet key authentication via MAC address

## Memulai

### 1. Konfigurasi environment

```bash
cp .env.example .env.local
# Isi MONGODB_URI, AUTH_SECRET, DEVICE_FLEET_KEY
```

### 2. Bootstrap admin

```bash
npm run bootstrap:admin
```

### 3. Jalankan dev server

```bash
npm run dev
```

### 4. Cek koneksi database

```
GET /api/health
```

## Firmware ESP32

Lihat folder `firmware/`. Salin `config.example.h` ke `config.h` dan isi WiFi + fleet key.

## Branch

- `main` — project hidroponik (ini)
- `sawah` — project sawah (monitoring irigasi sawah)
