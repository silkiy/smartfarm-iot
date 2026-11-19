import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getWeatherConfiguration,
  getWhatsAppConfiguration,
} from "../src/server/integrations/config";

describe("provider configuration", () => {
  it("keeps WhatsApp disabled; public Open-Meteo needs no credentials", () => {
    assert.deepEqual(getWhatsAppConfiguration({}), {
      status: "NOT_CONFIGURED",
      missing: [
        "WHATSAPP_ACCESS_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_TEST_RECIPIENT",
      ],
    });
    assert.deepEqual(getWeatherConfiguration({}), {
      status: "CONFIGURED",
      missing: [],
    });
  });

  it("explicit false disables providers even if credentials are present", () => {
    assert.equal(
      getWeatherConfiguration({ WEATHER_ENABLED: "false" }).status,
      "NOT_CONFIGURED",
    );
    assert.equal(
      getWhatsAppConfiguration({
        WHATSAPP_ENABLED: "false",
        WHATSAPP_ACCESS_TOKEN: "token",
        WHATSAPP_PHONE_NUMBER_ID: "phone",
        WHATSAPP_TEST_RECIPIENT: "recipient",
      }).status,
      "NOT_CONFIGURED",
    );
  });

  it("reports incomplete enabled configuration", () => {
    assert.equal(
      getWhatsAppConfiguration({ WHATSAPP_ENABLED: "true" }).status,
      "INVALID_CONFIGURATION",
    );
  });

  it("reports configured providers without making network calls", () => {
    assert.equal(
      getWhatsAppConfiguration({
        WHATSAPP_ENABLED: "true",
        WHATSAPP_ACCESS_TOKEN: "test-token",
        WHATSAPP_PHONE_NUMBER_ID: "test-phone",
        WHATSAPP_TEST_RECIPIENT: "test-recipient",
      }).status,
      "CONFIGURED",
    );
    assert.equal(
      getWeatherConfiguration({
        WEATHER_ENABLED: "true",
        WEATHER_API_URL: "https://weather.test",
        WEATHER_LOCATION: "test-location",
      }).status,
      "CONFIGURED",
    );
  });
});
