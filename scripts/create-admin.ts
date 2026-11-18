import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { userInputSchema } from "../src/domain/workspace";
import { hashPassword } from "../src/server/auth/passwords";
import {
  getMongoClientPromise,
  getMongoDatabase,
} from "../src/server/db/mongodb";
import { ensureDatabaseIndexes } from "../src/server/db/mongodb-indexes";
async function main() {
  loadEnvConfig(process.cwd(), true);
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const terminal = createInterface({
    input: process.stdin,
    output,
    terminal: Boolean(process.stdin.isTTY),
  });
  try {
    const email =
      process.env.ADMIN_BOOTSTRAP_EMAIL ||
      (await terminal.question("Email admin: "));
    const displayName =
      process.env.ADMIN_BOOTSTRAP_NAME ||
      (await terminal.question("Nama admin: "));
    let password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!password) {
      process.stdout.write(
        "Kata sandi (minimal 9 karakter, tidak ditampilkan): ",
      );
      muted = true;
      password = await terminal.question("");
      muted = false;
      process.stdout.write("\n");
    }
    const fields = userInputSchema.parse({
      email,
      displayName,
      password,
      role: "ADMIN",
    });
    const db = await getMongoDatabase();
    await ensureDatabaseIndexes(db);
    const now = new Date();
    const { password: rawPassword, ...profile } = fields;
    await db.collection("profiles").insertOne({
      ...profile,
      userId: randomUUID(),
      passwordHash: await hashPassword(rawPassword),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log("Akun admin dibuat. Akun yang sudah ada tidak diubah.");
  } catch {
    console.error(
      "Admin gagal dibuat. Periksa koneksi MongoDB, email unik, dan kata sandi minimal 9 karakter (maksimal 72 byte).",
    );
    process.exitCode = 1;
  } finally {
    muted = false;
    terminal.close();
    if (globalThis.mongodbClientPromise)
      await (await getMongoClientPromise()).close();
  }
}
void main().catch(() => {
  console.error("Account setup failed");
  process.exitCode = 1;
});
