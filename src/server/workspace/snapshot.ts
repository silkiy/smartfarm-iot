import type {
  AlertDocument,
  IrrigationRuleDocument,
  ProfileDocument,
  SensorReadingDocument,
} from "@/domain/models";
import {
  defaultRule,
  type WorkspaceSnapshot,
} from "@/features/workspace/types";
import { visibleResources } from "./access";
import type { Db } from "mongodb";
import type { AuthenticatedUser } from "@/server/auth/policy";

export async function workspaceSnapshot(
  db: Db,
  user: AuthenticatedUser,
): Promise<WorkspaceSnapshot> {
  const { farms, zones } = await visibleResources(db, user);
  const latestReadings = await db
    .collection<SensorReadingDocument>("sensor_readings")
    .aggregate<SensorReadingDocument>([
      { $match: { zoneId: { $in: zones.map((z) => z._id.toHexString()) } } },
      { $sort: { measuredAt: -1 } },
      { $group: { _id: "$zoneId", reading: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$reading" } },
    ])
    .toArray();
  const readingsByZone = new Map(latestReadings.map((r) => [r.zoneId, r]));
  const profile = await db
    .collection<ProfileDocument>("profiles")
    .findOne({ userId: user.id, isActive: true });
  if (!profile) throw new Error("PROFILE_UNAVAILABLE");
  const rules = await db
    .collection<IrrigationRuleDocument>("irrigation_rules")
    .find({ zoneId: { $in: zones.map((z) => z._id) } })
    .toArray();
  const alerts = await db
    .collection<AlertDocument>("alerts")
    .find({
      $or: [
        { recipientUserId: user.id },
        {
          recipientUserId: { $exists: false },
          farmId: { $in: farms.map((f) => f._id) },
          $or: [
            { zoneId: { $exists: false } },
            { zoneId: { $in: zones.map((z) => z._id) } },
          ],
        },
      ],
    })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();
  return {
    user: {
      id: user.id,
      name: profile.displayName,
      email: profile.email,
      role: profile.role,
    },
    farms: farms.map((f) => ({
      id: f._id.toHexString(),
      isDemo: f.isDemo === true,
      name: f.name,
      location: f.location ?? "",
      area: (f.areaM2 ?? 0).toLocaleString("id-ID"),
      phase: f.phase ?? "Vegetatif",
      ownerUserId: f.ownerUserId,
      latitude: f.latitude,
      longitude: f.longitude,
    })),
    // Only existing readings are returned. Device heartbeat integration is deferred.
    zones: zones.map((z) => ({
      id: z._id.toHexString(),
      farmId: z.farmId.toHexString(),
      name: z.name,
      moisture: readingsByZone.get(z._id.toHexString())?.soilMoisture ?? 0,
      water: readingsByZone.get(z._id.toHexString())?.waterLevelCm ?? 0,
      online: false,
      hasReading: readingsByZone.has(z._id.toHexString()),
      assignedUserIds: z.assignedUserIds,
      controlUserIds: z.controlUserIds,
    })),
    rules: Object.fromEntries(
      rules.map((r) => [
        r.zoneId.toHexString(),
        {
          ...defaultRule,
          enabled: r.isEnabled,
          phase: r.growthPhase ?? defaultRule.phase,
          threshold: r.minimumSoilMoisture ?? defaultRule.threshold,
          target: r.maximumWaterLevelCm ?? defaultRule.target,
          schedule: r.schedule ?? defaultRule.schedule,
        },
      ]),
    ),
    preferences: profile.preferences ?? { web: true, whatsapp: false },
    notices: alerts.map((a) => ({
      id: a._id.toHexString(),
      title: a.title ?? a.type,
      message: a.message,
      time: a.occurredAt.toISOString(),
      category:
        a.type === "IRRIGATION"
          ? "Irigasi"
          : a.type === "WARNING"
            ? "Peringatan"
            : "Sistem",
      read: a.readByUserIds?.includes(user.id) ?? false,
    })),
  };
}
