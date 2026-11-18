import { createHash } from "node:crypto";
import { getMongoDatabase } from "@/server/db/mongodb";
import { findProfileByEmail } from "./users";
import { verifyPassword } from "./passwords";
import { credentialsSchema } from "@/domain/users";
// Valid bcrypt hash keeps unknown-account checks comparable to password failures.
const dummyHash =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttx0NbbkCxvZDHPd/FZJrFwbkTFO";
export async function authenticateCredentials(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const db = await getMongoDatabase();
  const windowMs = 15 * 60_000;
  const key =
    createHash("sha256").update(parsed.data.email.toLowerCase()).digest("hex") +
    ":" +
    Math.floor(Date.now() / windowMs);
  const attempts = db.collection<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>("auth_attempts");
  const attempt = await attempts.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(Date.now() + windowMs * 2) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!attempt || attempt.count > 10) return null;
  const profile = await findProfileByEmail(parsed.data.email);
  const valid = await verifyPassword(
    parsed.data.password,
    profile?.passwordHash ?? dummyHash,
  );
  if (!profile || !valid) return null;
  await attempts.deleteOne({ _id: key });
  return {
    id: profile.userId,
    email: profile.email,
    name: profile.displayName,
    role: profile.role,
  };
}
