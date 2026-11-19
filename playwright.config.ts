import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

const testUri = process.env.TEST_MONGODB_URI;
if (!testUri || !new URL(testUri).pathname.startsWith("/smartfarm_test_")) {
  throw new Error(
    "TEST_MONGODB_URI wajib menunjuk database pengujian khusus dengan nama smartfarm_test_*.",
  );
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3120";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 -p 3120",
        url: `${baseURL}/login`,
        env: {
          MONGODB_URI: testUri,
          MONGODB_DB: new URL(testUri).pathname.slice(1),
          AUTH_SECRET: randomBytes(48).toString("base64url"),
          AUTH_TRUST_HOST: "true",
          AUTH_URL: baseURL,
          WHATSAPP_ENABLED: "false",
          WEATHER_ENABLED: "false",
        },
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
