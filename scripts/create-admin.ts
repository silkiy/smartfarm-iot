import { randomUUID } from "node:crypto";
import { getMongoDatabase } from "../src/lib/mongodb";
import { collectionNames, type ProfileDocument } from "../src/domain/models";
import { hashPassword } from "../src/services/passwords";

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const displayName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Administrator";

if (!email || !password) {
  throw new Error(
    "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD before running bootstrap",
  );
}

const database = await getMongoDatabase();
const now = new Date();
const profile: ProfileDocument = {
  userId: randomUUID(),
  email,
  displayName,
  role: "ADMIN",
  isActive: true,
  passwordHash: await hashPassword(password),
  createdAt: now,
  updatedAt: now,
};

await database.collection<ProfileDocument>(collectionNames.profiles).updateOne(
  { email },
  { $set: profile },
  { upsert: true },
);

console.log(`Admin profile bootstrapped for ${email}`);
