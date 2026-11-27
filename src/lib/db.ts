import { MongoClient, type Db } from "mongodb";
import { getEnv } from "./env";

/**
 * One client per process. Cached on globalThis so Next.js dev hot-reload and
 * serverless invocations reuse the same pool instead of leaking connections.
 */
const CLIENT_PROMISE_KEY = "_smartfarmMongoClientPromise";

const CLIENT_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  maxPoolSize: 10,
} as const;

type MongoGlobal = typeof globalThis & {
  [CLIENT_PROMISE_KEY]?: Promise<MongoClient>;
};

function getGlobalStore(): MongoGlobal {
  return globalThis as MongoGlobal;
}

export function getMongoClient(): Promise<MongoClient> {
  const store = getGlobalStore();
  const pending = store[CLIENT_PROMISE_KEY];

  if (pending) {
    return pending;
  }

  const client = new MongoClient(getEnv().MONGODB_URI, CLIENT_OPTIONS);

  // Drop a failed attempt so the next call can retry instead of replaying the
  // same rejection for the lifetime of the process.
  const connecting = client.connect().catch((error: unknown) => {
    delete store[CLIENT_PROMISE_KEY];
    throw error;
  });

  store[CLIENT_PROMISE_KEY] = connecting;
  return connecting;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getEnv().MONGODB_DB_NAME);
}

/** Used by CLI scripts and tests so the process can exit cleanly. */
export async function closeMongoClient(): Promise<void> {
  const store = getGlobalStore();
  const pending = store[CLIENT_PROMISE_KEY];

  if (!pending) {
    return;
  }

  delete store[CLIENT_PROMISE_KEY];
  const client = await pending;
  await client.close();
}
