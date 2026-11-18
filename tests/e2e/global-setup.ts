import { randomUUID } from "node:crypto";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword } from "../../src/server/auth/passwords";
import { ensureDatabaseIndexes } from "../../src/server/db/mongodb-indexes";
export default async function setup() {
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/accounts.json", "[]");
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri || !new URL(uri).pathname.startsWith("/smartfarm_test_"))
    throw new Error(
      "Set TEST_MONGODB_URI to a dedicated smartfarm_test_* database.",
    );
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    await ensureDatabaseIndexes(db);
    const accounts = [];
    for (const role of [
      "ADMIN",
      "LANDOWNER",
      "LANDOWNER",
      "FIELD_WORKER",
    ] as const) {
      const id = randomUUID(),
        email = `${id}@example.invalid`,
        password = randomUUID() + "Aa!";
      await db.collection("profiles").insertOne({
        userId: id,
        email,
        displayName: role,
        role,
        isActive: true,
        passwordHash: await hashPassword(password),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      accounts.push({ userId: id, email, password, role });
      await writeFile("test-results/accounts.json", JSON.stringify(accounts));
    }
    const farmId = new ObjectId(),
      zoneId = new ObjectId(),
      hiddenZoneId = new ObjectId();
    await db.collection("farms").insertOne({
      _id: farmId,
      name: "Sawah pengujian",
      location: "Lamongan",
      areaM2: 2500,
      phase: "Vegetatif",
      ownerUserId: accounts[1].userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("zones").insertMany([
      {
        _id: zoneId,
        farmId,
        name: "Zona ditugaskan",
        isActive: true,
        assignedUserIds: [accounts[3].userId],
        controlUserIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: hiddenZoneId,
        farmId,
        name: "Zona privat",
        isActive: true,
        assignedUserIds: [],
        controlUserIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    await db.collection("alerts").insertOne({
      farmId,
      zoneId,
      type: "WARNING",
      title: "Peringatan pengujian",
      message: "Notifikasi pengujian akses",
      occurredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await writeFile(
      "test-results/resources.json",
      JSON.stringify({
        farmId: farmId.toHexString(),
        zoneId: zoneId.toHexString(),
        hiddenZoneId: hiddenZoneId.toHexString(),
      }),
    );
    await writeFile("test-results/accounts.json", JSON.stringify(accounts));
  } finally {
    await client.close();
  }
}
export async function readAccounts(): Promise<
  { userId: string; email: string; password: string; role: string }[]
> {
  return JSON.parse(await readFile("test-results/accounts.json", "utf8"));
}
