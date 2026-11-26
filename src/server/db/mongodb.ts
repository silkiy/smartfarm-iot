import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI belum dikonfigurasi.");

  if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    globalThis._mongoClientPromise = client.connect().catch((err: unknown) => {
      globalThis._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalThis._mongoClientPromise;
}

export async function getMongoDatabase() {
  const client = await getMongoClientPromise();
  const db = process.env.MONGODB_DB?.trim();
  return client.db(db || undefined);
}
