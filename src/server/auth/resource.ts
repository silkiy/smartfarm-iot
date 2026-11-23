import type { FarmDocument, ZoneDocument } from "@/domain/models";
import { assertZoneAccess, type AuthenticatedUser } from "@/server/auth/policy";
import { getCollection } from "@/server/db/collections";
import type { Db, ObjectId } from "mongodb";

export async function requireZoneAccess(
  database: Db,
  user: AuthenticatedUser,
  zoneId: ObjectId,
): Promise<ZoneDocument> {
  const zone = await getCollection<ZoneDocument>(database, "zones").findOne({
    _id: zoneId,
  });
  if (!zone) {
    throw new Error("ZONE_NOT_FOUND");
  }

  const farm = await getCollection<FarmDocument>(database, "farms").findOne({
    _id: zone.farmId,
  });
  if (!farm) {
    throw new Error("FARM_NOT_FOUND");
  }

  assertZoneAccess(user, farm);
  return zone;
}
