import type { Collection, Db, Document } from "mongodb";
import { collectionNames } from "@/domain/models";

export function getCollection<T extends Document>(
  database: Db,
  name: keyof typeof collectionNames,
): Collection<T> {
  return database.collection<T>(collectionNames[name]);
}
