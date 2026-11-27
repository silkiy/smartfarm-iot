import "server-only";
import { getMongoDatabase } from "@/server/db/mongodb";

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

/**
 * Cek apakah username sudah melebihi batas percobaan login.
 * Menulis attempt ke collection auth_attempts (TTL index sudah ada).
 * Return true = boleh lanjut, false = terlalu banyak percobaan.
 */
export async function checkRateLimit(username: string): Promise<boolean> {
  const db = await getMongoDatabase();
  const col = db.collection("auth_attempts");
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const count = await col.countDocuments({
    username,
    createdAt: { $gte: windowStart },
  });

  if (count >= MAX_ATTEMPTS) return false;

  // Tulis attempt baru dengan TTL
  await col.insertOne({
    username,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
  });

  return true;
}

/** Hapus attempt setelah login berhasil */
export async function clearAttempts(username: string): Promise<void> {
  const db = await getMongoDatabase();
  await db.collection("auth_attempts").deleteMany({ username });
}
