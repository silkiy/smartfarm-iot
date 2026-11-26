import { getMongoDatabase } from "@/server/db/mongodb";
import { ok, err } from "@/server/http/response";

export async function GET() {
  try {
    const db = await getMongoDatabase();
    await db.command({ ping: 1 });
    return ok({ status: "ok", db: "connected" });
  } catch {
    return err(503, "DB_UNAVAILABLE", "Database tidak dapat dijangkau.");
  }
}
