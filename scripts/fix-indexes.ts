import { loadEnvConfig } from "@next/env";
import { getMongoClientPromise, getMongoDatabase } from "../src/server/db/mongodb";
import { ensureIndexes } from "../src/server/db/indexes";

async function main() {
  loadEnvConfig(process.cwd(), true);
  const db = await getMongoDatabase();

  // Drop index lama dari project sawah jika ada
  const oldIndexes = [
    "profiles_user_id_unique",
    "profiles_email_unique",
    "zones_worker_active",
    "devices_device_id_unique",
    "readings_device_measured_at",
    "readings_zone_measured_at",
    "commands_idempotency_unique",
    "weather_farm_fetched_at",
    "commands_status_time",
    "readings_request_id_unique",
    "auth_attempts_expiry",
  ];
  for (const name of oldIndexes) {
    for (const col of [
      "profiles",
      "devices",
      "sensor_readings",
      "device_commands",
      "weather_records",
      "auth_attempts",
    ]) {
      try {
        await db.collection(col).dropIndex(name);
        console.log(`Dropped: ${col}/${name}`);
      } catch {
        // tidak ada — lanjut
      }
    }
  }

  await ensureIndexes(db);
  console.log("✅ Indexes berhasil dibuat ulang.");
}

void main()
  .catch((e: unknown) => {
    console.error("Gagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (await getMongoClientPromise()).close();
  });
