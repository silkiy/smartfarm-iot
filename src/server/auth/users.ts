import type { ProfileDocument } from "@/domain/models";
import { getMongoDatabase } from "@/server/db/mongodb";
import { getCollection } from "@/server/db/collections";

export async function findProfileByEmail(
  email: string,
): Promise<ProfileDocument | null> {
  const database = await getMongoDatabase();
  return getCollection<ProfileDocument>(database, "profiles").findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
}
