import type { ProfileDocument } from "@/domain/models";
import { getMongoDatabase } from "@/lib/mongodb";
import { getCollection } from "@/repositories/collections";

export async function findProfileByEmail(
  email: string,
): Promise<ProfileDocument | null> {
  const database = await getMongoDatabase();
  return getCollection<ProfileDocument>(database, "profiles").findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
}
