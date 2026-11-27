/**
 * Bootstrap akun admin pertama.
 *
 * PowerShell:
 *   $env:ADMIN_USERNAME = "admin"
 *   $env:ADMIN_PASSWORD = "password123"
 *   $env:ADMIN_DISPLAY_NAME = "Administrator"
 *   npx tsx scripts/create-admin.ts
 */
import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/server/auth/passwords";
import { ensureIndexes } from "../src/server/db/indexes";
import { getMongoClientPromise, getMongoDatabase } from "../src/server/db/mongodb";
import type { ProfileDocument } from "../src/domain/models";

async function main() {
  loadEnvConfig(process.cwd(), true);

  const username = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const displayName = (process.env.ADMIN_DISPLAY_NAME ?? "Administrator").trim();

  if (!username || username.length < 3)
    throw new Error("ADMIN_USERNAME minimal 3 karakter.");
  if (!/^[a-z0-9_]+$/.test(username))
    throw new Error("ADMIN_USERNAME hanya boleh huruf kecil, angka, dan _.");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD minimal 8 karakter.");

  const db = await getMongoDatabase();
  await ensureIndexes(db);

  const existing = await db.collection<ProfileDocument>("profiles").findOne({ username });

  if (existing) {
    console.log(`Akun '${username}' sudah ada. Tidak ada perubahan.`);
    return;
  }

  const now = new Date();
  await db.collection<ProfileDocument>("profiles").insertOne({
    userId: randomUUID(),
    username,
    displayName,
    role: "ADMIN",
    isActive: true,
    passwordHash: await hashPassword(password),
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✅ Akun admin '${username}' berhasil dibuat.`);
  console.log(`   Display name : ${displayName}`);
  console.log(`   Role         : ADMIN`);
  console.log(`\nHapus variabel ADMIN_PASSWORD dari environment setelah ini.`);
}

void main()
  .catch((e: unknown) => {
    console.error("Gagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (await getMongoClientPromise()).close();
  });
