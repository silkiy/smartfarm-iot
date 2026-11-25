/**
 * clear-data.ts
 *
 * Hapus semua data kecuali akun admin yang emailnya diberikan.
 * Gunakan hanya di database pengembangan/staging.
 *
 * Jalankan:
 *   $env:KEEP_ADMIN_EMAIL = 'silki@dummy.com'
 *   npx tsx scripts/clear-data.ts
 */
import { loadEnvConfig } from "@next/env";
import {
  getMongoClientPromise,
  getMongoDatabase,
} from "../src/server/db/mongodb";
import { collectionNames } from "../src/domain/models";

async function main() {
  loadEnvConfig(process.cwd(), true);

  const keepEmail = (process.env.KEEP_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!keepEmail) {
    console.error(
      "Set KEEP_ADMIN_EMAIL ke email admin yang ingin dipertahankan.",
    );
    process.exitCode = 1;
    return;
  }

  const db = await getMongoDatabase();

  // Pastikan akun yang akan dipertahankan ada
  const admin = await db
    .collection("profiles")
    .findOne({ email: keepEmail, role: "ADMIN" });

  if (!admin) {
    console.error(
      `Akun admin '${keepEmail}' tidak ditemukan atau bukan ADMIN. Operasi dibatalkan.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Mempertahankan: ${admin.email} (${admin.userId})`);
  console.log("Menghapus semua koleksi kecuali akun tersebut...\n");

  const collections = [
    collectionNames.farms,
    collectionNames.zones,
    collectionNames.devices,
    collectionNames.sensors,
    collectionNames.sensorReadings,
    collectionNames.irrigationRules,
    collectionNames.deviceCommands,
    collectionNames.irrigationEvents,
    collectionNames.alerts,
    collectionNames.notificationLogs,
    collectionNames.weatherRecords,
    "auth_attempts",
    "whatsapp_test_logs",
  ];

  for (const name of collections) {
    const result = await db.collection(name).deleteMany({});
    console.log(`  ${name}: hapus ${result.deletedCount} dokumen`);
  }

  // Hapus semua profil kecuali admin yang dipertahankan
  const profileResult = await db
    .collection("profiles")
    .deleteMany({ email: { $ne: keepEmail } });
  console.log(
    `  profiles: hapus ${profileResult.deletedCount} dokumen (admin dipertahankan)`,
  );

  // Pastikan akun admin masih ACTIVE dan role benar
  await db.collection("profiles").updateOne(
    { email: keepEmail },
    {
      $set: {
        role: "ADMIN",
        isActive: true,
        isDemo: false,
        updatedAt: new Date(),
      },
      $unset: { seedBatch: "", seedKey: "" },
    },
  );

  console.log("\nSelesai. Database bersih, akun admin dipertahankan.");
  console.log(`Email : ${admin.email}`);
  console.log(
    "Langkah selanjutnya: login dan daftarkan lahan/zona/device baru.",
  );
}

void main()
  .catch((error: unknown) => {
    console.error(
      "Gagal:",
      error instanceof Error ? error.message : "UnknownError",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await (await getMongoClientPromise()).close();
  });
