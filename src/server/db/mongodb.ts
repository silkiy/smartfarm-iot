import { MongoClient } from "mongodb";

declare global {
  var mongodbClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!globalThis.mongodbClientPromise) {
    const client = new MongoClient(uri);
    globalThis.mongodbClientPromise = client.connect();
  }

  return globalThis.mongodbClientPromise;
}

export async function getMongoDatabase() {
  const client = await getMongoClientPromise();
  const databaseName = process.env.MONGODB_DB?.trim();

  return client.db(databaseName || undefined);
}
