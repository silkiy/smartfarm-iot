import type { Db, ObjectId } from "mongodb";
import type { FarmDocument, ZoneDocument } from "@/domain/models";
import { getCollection } from "@/repositories/collections";
import {
  assertZoneAccess,
  type AuthenticatedUser,
  type ZoneAction,
} from "@/lib/authz/policy";

export async function requireZoneAccess(
  database: Db,
  user: AuthenticatedUser,
  zoneId: ObjectId,
  action: ZoneAction,
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

  assertZoneAccess(user, farm, zone, action);
  return zone;
}
