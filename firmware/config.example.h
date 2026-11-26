/**
 * config.example.h
 * Salin ke config.h lalu isi nilainya.
 * config.h TIDAK di-commit ke repo (.gitignore).
 * File ini SAMA untuk semua ESP32 dalam satu deployment.
 */
#pragma once

#define WIFI_SSID      "nama_wifi_anda"
#define WIFI_PASSWORD  "password_wifi_anda"

#define API_BASE_URL   "https://your-project.vercel.app"

// Cocokkan dengan DEVICE_FLEET_KEY di Vercel environment variables
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#define FLEET_KEY      "isi_fleet_key_dari_vercel"
