import type { FarmDocument, ZoneDocument } from "@/domain/models";
import {
  assertFarmAccess,
  assertZoneAccess,
  type AuthenticatedUser,
} from "@/server/auth/policy";
import { ApiError, objectId } from "@/server/http/api";
import type { Db } from "mongodb";

export async function farmAccess(db: Db, user: AuthenticatedUser, id: string) {
  const farm = await db
    .collection<FarmDocument>("farms")
    .findOne({ _id: objectId(id), archivedAt: { $exists: false } });
  if (!farm)
    throw new ApiError(404, "FARM_NOT_FOUND", "Lahan tidak ditemukan.");
  assertFarmAccess(user, farm);
  return farm;
}

export async function zoneAccess(db: Db, user: AuthenticatedUser, id: string) {
  const zone = await db.collection<ZoneDocument>("zones").findOne({
    _id: objectId(id),
    isActive: true,
    archivedAt: { $exists: false },
  });
  if (!zone) throw new ApiError(404, "ZONE_NOT_FOUND", "Zona tidak ditemukan.");
  const farm = await db
    .collection<FarmDocument>("farms")
    .findOne({ _id: zone.farmId, archivedAt: { $exists: false } });
  if (!farm)
    throw new ApiError(404, "FARM_NOT_FOUND", "Lahan tidak ditemukan.");
  assertZoneAccess(user, farm);
  return { zone, farm };
}

export async function visibleResources(db: Db, user: AuthenticatedUser) {
  const ownerFilter = user.role === "ADMIN" ? {} : { ownerUserId: user.id };
  const farms = await db
    .collection<FarmDocument>("farms")
    .find({ ...ownerFilter, archivedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .toArray();
  const zones = await db
    .collection<ZoneDocument>("zones")
    .find({
      farmId: { $in: farms.map((f) => f._id) },
      isActive: true,
      archivedAt: { $exists: false },
    })
    .sort({ createdAt: 1 })
    .toArray();
  return { farms, zones };
}
