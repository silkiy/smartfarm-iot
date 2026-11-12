import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getWeatherConfiguration,
  getWhatsAppConfiguration,
} from "../src/services/providers/config";

describe("provider configuration", () => {
  it("keeps providers disabled when credentials are absent", () => {
    assert.deepEqual(getWhatsAppConfiguration({}), {
      status: "NOT_CONFIGURED",
      missing: [
        "WHATSAPP_ACCESS_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_TEST_RECIPIENT",
      ],
    });
    assert.deepEqual(getWeatherConfiguration({}), {
      status: "NOT_CONFIGURED",
      missing: ["WEATHER_API_URL", "WEATHER_LOCATION"],
    });
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
