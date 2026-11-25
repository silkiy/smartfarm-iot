/**
 * smartfarm.ino — SmartFarm IoT Firmware
 * ESP32 DevKit V1 | Versi: 2.0.0
 *
 * Desain: satu firmware untuk semua ESP32 di fleet.
 * Identitas device (deviceId, farmId, zoneId) diambil dari server
 * menggunakan MAC address — tidak perlu ubah kode per device.
 *
 * Sensor:
 *   - Kelembapan tanah kapasitif V1.2 → GPIO34 (ADC1_CH6)
 *   - Ultrasonik HC-SR04              → TRIG: GPIO5, ECHO: GPIO18
 *     ECHO diturunkan dari 5V ke 3.3V via voltage divider (1kΩ / 2kΩ)
 *
 * Alur:
 *   1. Sambung WiFi
 *   2. Tampilkan MAC address di Serial Monitor
 *   3. Provision: POST /api/devices/provision → dapat deviceId, farmId, zoneId
 *      - Jika belum terdaftar di dashboard → tunggu 30 detik, coba lagi
 *      - Jika dinonaktifkan admin → tunggu 60 detik, coba lagi
 *   4. Loop: baca sensor → kirim ingest → poll perintah (tiap 10 detik)
 *   5. Jika WiFi putus → reconnect otomatis sebelum kirim data
 *
 * Konfigurasi: hanya config.h yang perlu diisi (WiFi + API_BASE_URL + FLEET_KEY)
 * Firmware ini sama untuk semua ESP32 dalam satu deployment.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// ── Pin ───────────────────────────────────────────────────────────────────────
static const int PIN_SOIL  = 34;  // ADC1_CH6 — sensor kelembapan (analog)
static const int PIN_TRIG  = 5;   // HC-SR04 trigger
static const int PIN_ECHO  = 18;  // HC-SR04 echo (via voltage divider)

// ── Kalibrasi sensor kelembapan ───────────────────────────────────────────────
// Setelah wiring selesai:
//   1. Biarkan sensor di udara → catat nilai ADC → isi SOIL_DRY_ADC
//   2. Celupkan sensor ke air  → catat nilai ADC → isi SOIL_WET_ADC
static const int SOIL_DRY_ADC = 3200;  // ADC saat sensor di udara kering (~0%)
static const int SOIL_WET_ADC =  800;  // ADC saat sensor terendam air (~100%)

// ── Timing ────────────────────────────────────────────────────────────────────
static const unsigned long SEND_INTERVAL_MS    = 10000;  // kirim data tiap 10 detik
static const unsigned long PROVISION_RETRY_MS  = 30000;  // retry provision tiap 30 detik
static const unsigned long DISABLED_RETRY_MS   = 60000;  // retry jika disabled tiap 60 detik
static const unsigned long WIFI_TIMEOUT_MS     = 15000;  // timeout koneksi WiFi 15 detik
static const int           WIFI_MAX_RETRY      = 3;      // max retry WiFi sebelum restart

// ── State global ──────────────────────────────────────────────────────────────
static String g_macAddress  = "";
static String g_deviceId    = "";
static String g_farmId      = "";
static String g_zoneId      = "";
static String g_pumpStatus  = "OFF";
static String g_valveStatus = "CLOSED";
static bool   g_provisioned = false;

// ── Deklarasi fungsi ──────────────────────────────────────────────────────────
bool  connectWiFi();
bool  provision();
float readSoilMoisture();
float readWaterLevelCm();
String generateUUID();
bool  sendSensorData(float soil, float water);
void  pollCommands();
void  sendCommandAck(const String& commandId, const String& status);
void  makeSecureClient(WiFiClientSecure& client);

// ── WiFi ──────────────────────────────────────────────────────────────────────
bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.printf("[WIFI] Menyambung ke %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT_MS) {
      Serial.println("\n[WIFI] Timeout.");
      return false;
    }
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WIFI] Terhubung. IP: %s\n", WiFi.localIP().toString().c_str());
  return true;
}

// ── Provisioning ──────────────────────────────────────────────────────────────
bool provision() {
  WiFiClientSecure client;
  makeSecureClient(client);

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/devices/provision";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Fleet-Key", FLEET_KEY);

  JsonDocument doc;
  doc["macAddress"] = g_macAddress;
  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  if (code == 200) {
    JsonDocument res;
    if (deserializeJson(res, resp) == DeserializationError::Ok) {
      g_deviceId = res["data"]["deviceId"].as<String>();
      g_farmId   = res["data"]["farmId"].as<String>();
      g_zoneId   = res["data"]["zoneId"].as<String>();
      Serial.printf("[PROV] OK — deviceId: %s\n", g_deviceId.c_str());
      return true;
    }
  }

  if (code == 403) {
    JsonDocument res;
    deserializeJson(res, resp);
    String errCode = res["error"]["code"].as<String>();
    if (errCode == "DEVICE_DISABLED") {
      Serial.println("[PROV] Device dinonaktifkan admin. Tunggu 60 detik...");
      delay(DISABLED_RETRY_MS);
    } else {
      Serial.println("[PROV] Belum terdaftar. Daftarkan MAC di dashboard, tunggu 30 detik...");
      delay(PROVISION_RETRY_MS);
    }
  } else {
    Serial.printf("[PROV] Error HTTP %d. Tunggu 30 detik...\n", code);
    delay(PROVISION_RETRY_MS);
  }
  return false;
}

// ── Sensor kelembapan ─────────────────────────────────────────────────────────
float readSoilMoisture() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PIN_SOIL);
    delay(5);
  }
  int raw = (int)(sum / 10);

  float pct = (float)(SOIL_DRY_ADC - raw) /
              (float)(SOIL_DRY_ADC - SOIL_WET_ADC) * 100.0f;
  if (pct < 0.0f)   pct = 0.0f;
  if (pct > 100.0f) pct = 100.0f;
  return pct;
}

// ── Sensor HC-SR04 ────────────────────────────────────────────────────────────
float readWaterLevelCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000UL);
  if (duration == 0) return -1.0f;  // timeout — sensor tidak terhubung

  float cm = (float)duration / 58.0f;
  if (cm < 0.0f)   cm = 0.0f;
  if (cm > 100.0f) cm = 100.0f;
  return cm;
}

// ── UUID v4 ───────────────────────────────────────────────────────────────────
String generateUUID() {
  uint32_t r[4] = {
    esp_random(), esp_random(), esp_random(), esp_random()
  };
  // Set version 4 dan variant bits
  r[1] = (r[1] & 0xFFFF0FFFUL) | 0x00004000UL;
  r[2] = (r[2] & 0x3FFFFFFFUL) | 0x80000000UL;

  char buf[37];
  snprintf(buf, sizeof(buf),
    "%08lx-%04lx-%04lx-%04lx-%04lx%08lx",
    (unsigned long)r[0],
    (unsigned long)(r[1] >> 16),
    (unsigned long)(r[1] & 0xFFFF),
    (unsigned long)(r[2] >> 16),
    (unsigned long)(r[2] & 0xFFFF),
    (unsigned long)r[3]
  );
  return String(buf);
}

// ── HTTPS client helper ───────────────────────────────────────────────────────
void makeSecureClient(WiFiClientSecure& client) {
  // Prototipe: skip verifikasi sertifikat.
  // Produksi: ganti dengan client.setCACert(ROOT_CA) untuk pinning.
  client.setInsecure();
}

// ── Kirim data sensor ─────────────────────────────────────────────────────────
bool sendSensorData(float soil, float water) {
  if (!connectWiFi()) return false;

  WiFiClientSecure client;
  makeSecureClient(client);

  HTTPClient http;
  http.begin(client, String(API_BASE_URL) + "/api/devices/ingest");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Fleet-Key",   FLEET_KEY);
  http.addHeader("X-Mac-Address", g_macAddress);

  JsonDocument doc;
  doc["macAddress"]   = g_macAddress;
  doc["soilMoisture"] = (float)(round(soil  * 10) / 10.0);
  doc["waterLevelCm"] = (float)(round(water * 10) / 10.0);
  doc["pumpStatus"]   = g_pumpStatus;
  doc["valveStatus"]  = g_valveStatus;
  doc["requestId"]    = generateUUID();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    Serial.printf("[INGEST] OK — soil: %.1f%% water: %.1f cm\n", soil, water);
    return true;
  }

  if (code == 403) {
    // Device dinonaktifkan atau dicabut — perlu provision ulang
    Serial.println("[INGEST] 403 — provision ulang...");
    g_provisioned = false;
  } else {
    Serial.printf("[INGEST] Error HTTP %d\n", code);
  }
  http.end();
  return false;
}

// ── Poll perintah ─────────────────────────────────────────────────────────────
void pollCommands() {
  if (!connectWiFi()) return;

  WiFiClientSecure client;
  makeSecureClient(client);

  HTTPClient http;
  http.begin(client, String(API_BASE_URL) + "/api/devices/commands");
  http.addHeader("X-Fleet-Key",   FLEET_KEY);
  http.addHeader("X-Mac-Address", g_macAddress);

  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    JsonDocument doc;
    if (deserializeJson(doc, resp) == DeserializationError::Ok) {
      JsonObject cmd = doc["data"]["command"];
      if (!cmd.isNull()) {
        String commandId = cmd["id"].as<String>();
        String actuator  = cmd["actuator"].as<String>();
        String action    = cmd["action"].as<String>();

        Serial.printf("[CMD] %s → %s %s\n",
          commandId.c_str(), actuator.c_str(), action.c_str());

        // Update status lokal
        if (actuator == "PUMP")  g_pumpStatus  = action;
        if (actuator == "VALVE") g_valveStatus = action;

        sendCommandAck(commandId, "EXECUTED");
      }
    }
  } else if (code == 403) {
    Serial.println("[CMD] 403 — provision ulang...");
    g_provisioned = false;
  }
  http.end();
}

// ── ACK perintah ──────────────────────────────────────────────────────────────
void sendCommandAck(const String& commandId, const String& status) {
  WiFiClientSecure client;
  makeSecureClient(client);

  HTTPClient http;
  http.begin(client, String(API_BASE_URL) + "/api/devices/commands");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Fleet-Key",   FLEET_KEY);
  http.addHeader("X-Mac-Address", g_macAddress);

  JsonDocument doc;
  doc["commandId"] = commandId;
  doc["status"]    = status;

  String body;
  serializeJson(doc, body);
  http.PATCH(body);
  http.end();
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  analogReadResolution(12);  // ADC 12-bit (0–4095)
  digitalWrite(PIN_TRIG, LOW);

  // Baca MAC address dari chip — tidak bisa dipalsukan
  g_macAddress = WiFi.macAddress();
  // WiFi.macAddress() mengembalikan format XX:XX:XX:XX:XX:XX uppercase
  g_macAddress.toUpperCase();

  Serial.println("\n╔══════════════════════════════╗");
  Serial.println("║   SmartFarm IoT  v2.0.0      ║");
  Serial.println("╚══════════════════════════════╝");
  Serial.printf("MAC Address : %s\n", g_macAddress.c_str());
  Serial.printf("Backend     : %s\n", API_BASE_URL);
  Serial.println("-------------------------------");
  Serial.println("Salin MAC address di atas ke dashboard untuk mendaftarkan device.");
  Serial.println("-------------------------------\n");
}

// ── Loop ──────────────────────────────────────────────────────────────────────
static unsigned long g_lastSend = 0;

void loop() {
  // Pastikan WiFi terhubung
  if (!connectWiFi()) {
    delay(5000);
    return;
  }

  // Provision jika belum atau setelah 403
  if (!g_provisioned) {
    g_provisioned = provision();
    if (!g_provisioned) return;  // provision() sudah delay di dalam
  }

  // Kirim data setiap SEND_INTERVAL_MS
  unsigned long now = millis();
  if (now - g_lastSend >= SEND_INTERVAL_MS) {
    g_lastSend = now;

    float soil  = readSoilMoisture();
    float water = readWaterLevelCm();

    if (water < 0.0f) {
      Serial.println("[SENSOR] HC-SR04 timeout — periksa kabel ECHO dan voltage divider");
      water = 0.0f;
    }

    sendSensorData(soil, water);
    pollCommands();
  }
}
