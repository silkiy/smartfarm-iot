import type { ProfileDocument } from "@/domain/models";
import { getCollection } from "@/server/db/collections";
import { getMongoDatabase } from "@/server/db/mongodb";

export async function findProfileByEmail(
  email: string,
): Promise<ProfileDocument | null> {
  const database = await getMongoDatabase();
  return getCollection<ProfileDocument>(database, "profiles").findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
}
