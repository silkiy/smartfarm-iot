import { loadEnvConfig } from "@next/env";
import { credentialsSchema } from "../src/domain/users";
import { hashPassword, verifyPassword } from "../src/server/auth/passwords";
import { ensureDatabaseIndexes } from "../src/server/db/mongodb-indexes";
import {
  getMongoClientPromise,
  getMongoDatabase,
} from "../src/server/db/mongodb";
import { createDummyData, dummyBatch } from "./lib/dummy-data";
class SeedConflictError extends Error {}

async function main() {
  loadEnvConfig(process.cwd(), true);
  const { email, password } = credentialsSchema.parse({
    email: process.env.DUMMY_ADMIN_EMAIL,
    password: process.env.DUMMY_SEED_PASSWORD,
  });
  const db = await getMongoDatabase();
  try {
    await ensureDatabaseIndexes(db);
    const existing = await db
      .collection("profiles")
      .findOne({ email: email.toLowerCase() });
    const data = createDummyData({
      adminEmail: email.toLowerCase(),
      adminUserId: existing?.userId,
      passwordHash: await hashPassword(password),
    });
    if (
      new Set(data.profiles.map((p) => p.email)).size !== 10 ||
      new Set(data.profiles.map((p) => p.userId)).size !== 10
    ) {
      throw new SeedConflictError(
        "Identitas admin berbenturan dengan akun dummy lain.",
      );
    }
    if (
      !existing &&
      (await db.collection("profiles").findOne({ _id: data.profiles[0]._id }))
    ) {
      throw new SeedConflictError(
        "Dataset ini sudah memiliki admin berbeda; akun tersebut tidak ditimpa.",
      );
    }
    for (const profile of data.profiles.slice(1)) {
      const collision = await db
        .collection("profiles")
        .findOne({ email: profile.email, seedBatch: { $ne: dummyBatch } });
      if (collision)
        throw new SeedConflictError(
          "Email dummy sudah digunakan akun lain; tidak ada akun tersebut yang ditimpa.",
        );
    }
    for (const [collection, rows] of Object.entries(data)) {
      const reservedIds = rows
        .map((row) => row._id)
        .filter(
          (id) =>
            collection !== "profiles" || !existing || !id.equals(existing._id),
        );
      const conflicts = await db.collection(collection).countDocuments({
        _id: { $in: reservedIds },
        seedBatch: { $ne: dummyBatch },
      });
      if (conflicts)
        throw new SeedConflictError(
          "ID seed berbenturan dengan data lain; operasi dihentikan.",
        );
    }
    for (const [collection, rows] of Object.entries(data)) {
      if (collection === "profiles") {
        for (const profile of rows) {
          if (profile.email === email.toLowerCase() && existing) continue;
          await db
            .collection(collection)
            .updateOne(
              { _id: profile._id },
              { $setOnInsert: profile },
              { upsert: true },
            );
        }
      } else {
        await db.collection(collection).bulkWrite(
          rows.map((row) => ({
            updateOne: {
              filter: { _id: row._id },
              update: { $setOnInsert: row },
              upsert: true,
            },
          })),
        );
      }
    }
    if (existing) {
      const passwordMatches = await verifyPassword(
        password,
        existing.passwordHash,
      );
      const mustReset =
        !passwordMatches || existing.role !== "ADMIN" || !existing.isActive;
      await db.collection("profiles").updateOne(
        { _id: existing._id },
        {
          $set: {
            role: "ADMIN",
            isActive: true,
            isDemo: true,
            seedBatch: dummyBatch,
            seedKey: "profiles-0",
            ...(mustReset
              ? { passwordHash: data.profiles[0].passwordHash }
              : {}),
            updatedAt: new Date(),
          },
          ...(mustReset ? { $inc: { sessionVersion: 1 } } : {}),
        },
      );
    }
    const counts = Object.fromEntries(
      await Promise.all(
        Object.keys(data).map(async (name) => [
          name,
          await db.collection(name).countDocuments({ seedBatch: dummyBatch }),
        ]),
      ),
    );
    if (Object.values(counts).some((count) => count !== 10))
      throw Error("Jumlah seed tidak sesuai 10 per kategori.");
    console.log(JSON.stringify({ adminEmail: email, counts }));
    console.log(
      "Data dummy tersimpan. Tidak ada hardware atau pesan yang dijalankan; data lain tidak dihapus.",
    );
  } finally {
    await (await getMongoClientPromise()).close();
  }
}
void main().catch((error: unknown) => {
  console.error(
    "Seed gagal:",
    error instanceof SeedConflictError
      ? error.message
      : error instanceof Error && !error.message.includes("mongodb")
        ? error.name
        : "DatabaseError",
  );
  process.exitCode = 1;
});
