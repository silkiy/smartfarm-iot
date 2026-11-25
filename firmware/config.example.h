/**
 * config.example.h
 * Salin file ini menjadi config.h lalu isi nilainya.
 * File config.h TIDAK boleh di-commit ke repo (sudah ada di .gitignore).
 */
#pragma once

// WiFi
#define WIFI_SSID     "nama_wifi_anda"
#define WIFI_PASSWORD "password_wifi_anda"

// Backend
#define API_BASE_URL  "https://smartfarm-iot-c2hk.vercel.app"
#define DEVICE_ID     "ESP32-SAWAH-01"
#define API_KEY       "isi_api_key_dari_dashboard"

// Interval kirim data (milidetik) — default 10 detik
#define SEND_INTERVAL_MS 10000
