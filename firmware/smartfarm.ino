/**
 * smartfarm.ino
 * Firmware SmartFarm IoT — ESP32 DevKit V1
 *
 * Sensor:
 *   - Kelembapan tanah kapasitif V1.2 → GPIO34 (ADC1)
 *   - Ultrasonik HC-SR04              → TRIG: GPIO5, ECHO: GPIO18
 *     (ECHO melalui voltage divider 1kΩ / 2kΩ karena output 5V)
 *
 * Alur:
 *   1. Sambung WiFi
 *   2. Baca kedua sensor
 *   3. POST ke /api/devices/ingest setiap SEND_INTERVAL_MS
 *   4. GET ke /api/devices/commands setiap SEND_INTERVAL_MS (siap untuk pompa)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// ── Pin ──────────────────────────────────────────────────────────────────────
#define PIN_SOIL_MOISTURE  34   // ADC1_CH6 — sensor kelembapan (analog)
#define PIN_TRIG           5    // HC-SR04 trigger
#define PIN_ECHO           18   // HC-SR04 echo (via voltage divider)

// ── Kalibrasi sensor kelembapan ──────────────────────────────────────────────
// Ukur nilai ADC saat sensor di udara kering dan saat terendam air penuh,
// lalu sesuaikan dua konstanta ini.
#define SOIL_DRY_ADC    3200    // nilai ADC saat sensor di udara (0% kelembapan)
#define SOIL_WET_ADC     800    // nilai ADC saat sensor terendam air (100%)

// ── State pompa & katup (diperbarui dari respons command) ────────────────────
static String pumpStatus  = "OFF";
static String valveStatus = "CLOSED";

// ── Fungsi baca sensor kelembapan ────────────────────────────────────────────
float readSoilMoisture() {
  // Rata-rata 10 sampel untuk kurangi noise ADC
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PIN_SOIL_MOISTURE);
    delay(5);
  }
  int raw = sum / 10;

  // Map: DRY_ADC → 0%, WET_ADC → 100%, clamp ke 0–100
  float pct = (float)(SOIL_DRY_ADC - raw) / (SOIL_DRY_ADC - SOIL_WET_ADC) * 100.0;
  if (pct < 0.0)   pct = 0.0;
  if (pct > 100.0) pct = 100.0;
  return pct;
}

// ── Fungsi baca HC-SR04 ───────────────────────────────────────────────────────
float readWaterLevelCm() {
  // Kirim pulsa 10µs
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Ukur durasi echo (timeout 30ms = ~500cm)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return -1.0;   // timeout / sensor tidak terhubung

  // Rumus: jarak (cm) = durasi (µs) / 58
  float distanceCm = duration / 58.0;

  // Clamp ke 0–100 cm
  if (distanceCm < 0.0)   distanceCm = 0.0;
  if (distanceCm > 100.0) distanceCm = 100.0;
  return distanceCm;
}

// ── Generate UUID v4 sederhana ────────────────────────────────────────────────
String generateUUID() {
  char buf[37];
  snprintf(buf, sizeof(buf),
    "%08lx-%04lx-4%03lx-%04lx-%012llx",
    (unsigned long)esp_random(),
    (unsigned long)(esp_random() & 0xFFFF),
    (unsigned long)(esp_random() & 0x0FFF),
    (unsigned long)((esp_random() & 0x3FFF) | 0x8000),
    ((unsigned long long)esp_random() << 32) | esp_random()
  );
  return String(buf);
}

// ── Kirim data sensor ke backend ─────────────────────────────────────────────
void sendSensorData(float soilMoisture, float waterLevel) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();   // skip verifikasi sertifikat (prototipe)

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/devices/ingest";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", API_KEY);

  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["soilMoisture"] = round(soilMoisture * 10) / 10.0;
  doc["waterLevelCm"] = round(waterLevel * 10) / 10.0;
  doc["pumpStatus"]   = pumpStatus;
  doc["valveStatus"]  = valveStatus;
  doc["requestId"]    = generateUUID();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("[INGEST] HTTP %d\n", code);
    if (code != 200) {
      Serial.println(http.getString());
    }
  } else {
    Serial.printf("[INGEST] Error: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

// ── Poll perintah dari backend ────────────────────────────────────────────────
void pollCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/devices/commands";
  http.begin(client, url);
  http.addHeader("X-Device-Key", API_KEY);

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

        // Update status lokal (eksekusi fisik menunggu relay/pompa)
        if (actuator == "PUMP")  pumpStatus  = action;
        if (actuator == "VALVE") valveStatus = action;

        // Kirim ACK ke backend
        sendCommandAck(commandId, "EXECUTED");
      }
    }
  }
  http.end();
}

// ── Kirim ACK perintah ────────────────────────────────────────────────────────
void sendCommandAck(const String& commandId, const String& status) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/devices/commands";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", API_KEY);

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
  delay(500);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  analogReadResolution(12);   // ADC 12-bit (0–4095)

  Serial.println("\n=== SmartFarm IoT ===");
  Serial.printf("Device ID : %s\n", DEVICE_ID);
  Serial.printf("Target    : %s\n", API_BASE_URL);

  // Sambung WiFi
  Serial.printf("\nMenyambung ke %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nTerhubung! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nGagal terhubung WiFi — cek SSID/password di config.h");
  }
}

// ── Loop ──────────────────────────────────────────────────────────────────────
static unsigned long lastSend = 0;

void loop() {
  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;

    float soil  = readSoilMoisture();
    float water = readWaterLevelCm();

    Serial.printf("[SENSOR] Kelembapan: %.1f%% | Ketinggian air: %.1f cm\n",
      soil, water);

    if (water < 0) {
      Serial.println("[SENSOR] HC-SR04 timeout — periksa kabel ECHO");
    }

    sendSensorData(soil, water < 0 ? 0.0 : water);
    pollCommands();
  }
}
