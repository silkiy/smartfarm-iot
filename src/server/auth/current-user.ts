import "server-only";
import { auth } from "@/auth";
import type { ProfileDocument } from "@/domain/models";
import { getMongoDatabase } from "@/server/db/mongodb";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const db = await getMongoDatabase();
  const profile = await db.collection<ProfileDocument>("profiles").findOne({
    userId: session.user.id,
    isActive: true,
  });
  if (!profile) return null;
  return {
    id: profile.userId,
    role: profile.role,
    name: profile.displayName,
    email: profile.email,
  };
}
