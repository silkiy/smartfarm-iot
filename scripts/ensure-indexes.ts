import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { IndexDescription } from "mongodb";
import { closeMongoClient, getDb } from "../src/lib/db";

// `next dev`/`next build` load .env automatically; standalone CLI scripts do not.
const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

type IndexSpec = {
  keys: IndexDescription["key"];
  name: string;
  unique?: boolean;
};

/** Index contract from PANDUAN.md §5.1. Keep names stable: they are referenced in reviews. */
const INDEXES: Record<string, IndexSpec[]> = {
  users: [{ keys: { email: 1 }, name: "users_email_unique", unique: true }],
  devices: [
    { keys: { deviceId: 1 }, name: "devices_deviceId_unique", unique: true },
    { keys: { apiKeyHash: 1 }, name: "devices_apiKeyHash_unique", unique: true },
    { keys: { ownerId: 1 }, name: "devices_ownerId" },
    { keys: { macAddress: 1 }, name: "devices_macAddress" },
  ],
  telemetry: [
    {
      keys: { deviceId: 1, recordedAt: -1 },
      name: "telemetry_deviceId_recordedAt",
    },
  ],
  alerts: [
    {
      keys: { ownerId: 1, resolved: 1, createdAt: -1 },
      name: "alerts_ownerId_resolved_createdAt",
    },
    {
      keys: { deviceId: 1, type: 1, resolved: 1 },
      name: "alerts_deviceId_type_resolved",
    },
  ],
};

async function main(): Promise<void> {
  const db = await getDb();

  for (const [collection, specs] of Object.entries(INDEXES)) {
    for (const spec of specs) {
      const createdName = await db.collection(collection).createIndex(
        spec.keys,
        spec.unique === undefined
          ? { name: spec.name }
          : { name: spec.name, unique: spec.unique },
      );

      console.log(
        JSON.stringify({
          level: "info",
          message: "index ensured",
          timestamp: new Date().toISOString(),
          collection,
          index: createdName,
        }),
      );
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "ensure-indexes failed",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoClient();
  });
