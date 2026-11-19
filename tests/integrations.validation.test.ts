import assert from "node:assert/strict";
import { test } from "node:test";
import { weatherResponseSchema } from "../src/server/integrations/weather";
import { whatsappSettings } from "../src/server/integrations/whatsapp";
test("weather provider rejects malformed or out-of-range responses", () => {
  assert.equal(
    weatherResponseSchema.safeParse({
      current: {
        time: 1,
        temperature_2m: 30,
        relative_humidity_2m: 70,
        wind_speed_10m: 5,
        weather_code: 3,
      },
    }).success,
    true,
  );
  assert.equal(
    weatherResponseSchema.safeParse({
      current: {
        time: 1,
        temperature_2m: 30,
        relative_humidity_2m: 170,
        wind_speed_10m: 5,
        weather_code: 3,
      },
    }).success,
    false,
  );
});
test("WhatsApp test settings fail closed without explicit enablement and valid identifiers", () => {
  const env = {
    WHATSAPP_ENABLED: "true",
    WHATSAPP_ACCESS_TOKEN: "token",
    WHATSAPP_PHONE_NUMBER_ID: "12345678",
    WHATSAPP_TEST_RECIPIENT: "628123456789",
    WHATSAPP_API_VERSION: "v27.0",
  };
  assert.equal(whatsappSettings(env).success, true);
  assert.equal(
    whatsappSettings({ ...env, WHATSAPP_ENABLED: "false" }).success,
    false,
  );
  assert.equal(
    whatsappSettings({ ...env, WHATSAPP_PHONE_NUMBER_ID: "../../other" })
      .success,
    false,
  );
});
