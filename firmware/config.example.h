/**
 * config.example.h
 *
 * Salin file ini menjadi config.h lalu isi nilainya.
 * File config.h TIDAK boleh di-commit ke repo — sudah ada di .gitignore.
 *
 * File ini SAMA untuk semua ESP32 dalam satu deployment.
 * Tidak perlu ubah per device — identitas device diambil otomatis dari
 * MAC address saat ESP32 pertama kali nyala.
 */
#pragma once

// ── WiFi ──────────────────────────────────────────────────────────────────────
#define WIFI_SSID      "nama_wifi_anda"
#define WIFI_PASSWORD  "password_wifi_anda"

// ── Backend ───────────────────────────────────────────────────────────────────
#define API_BASE_URL   "https://smartfarm-iot-c2hk.vercel.app"

// ── Fleet Key ─────────────────────────────────────────────────────────────────
// Satu key untuk semua ESP32 — cocokkan dengan DEVICE_FLEET_KEY di Vercel.
// Generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#define FLEET_KEY      "isi_fleet_key_dari_vercel_env"
