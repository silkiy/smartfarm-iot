import { readAccounts } from "./global-setup";
import { MongoClient, ObjectId } from "mongodb";
export default async function teardown() {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri || !new URL(uri).pathname.startsWith("/smartfarm_test_"))
    throw new Error("Unsafe test database.");
  const accounts = await readAccounts();
  const ids = accounts.map((a) => a.userId);
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    const farms = await db
      .collection("farms")
      .find({ ownerUserId: { $in: ids } })
      .toArray();
    const farmIds = farms.map((f) => new ObjectId(f._id));
    const zones = await db
      .collection("zones")
      .find({ farmId: { $in: farmIds } })
      .toArray();
    const zoneIds = zones.map((z) => new ObjectId(z._id));
    for (const name of [
      "irrigation_rules",
      "alerts",
      "weather_records",
      "irrigation_events",
    ])
      await db.collection(name).deleteMany({ farmId: { $in: farmIds } });
    await db
      .collection("sensor_readings")
      .deleteMany({ zoneId: { $in: zoneIds.map((z) => z.toHexString()) } });
    await db.collection("zones").deleteMany({ farmId: { $in: farmIds } });
    await db.collection("farms").deleteMany({ _id: { $in: farmIds } });
    await db.collection("profiles").deleteMany({ userId: { $in: ids } });
  } finally {
    await client.close();
  }
}
