import { reportQuerySchema } from "@/domain/report";
import type {
  SensorReadingDocument,
  IrrigationEventDocument,
} from "@/domain/models";
import { api, ApiError, json } from "@/server/http/api";
import { visibleResources } from "@/server/workspace/access";
export async function GET(request: Request) {
  return api(request, async (user, db) => {
    const query = reportQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const { farms, zones } = await visibleResources(db, user);
    if (!farms.some((f) => f._id.toHexString() === query.farmId))
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Anda tidak memiliki akses ke lahan ini.",
      );
    const selected = zones.filter(
      (z) =>
        z.farmId.toHexString() === query.farmId &&
        (!query.zoneId || z._id.toHexString() === query.zoneId),
    );
    if (query.zoneId && !selected.length)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Anda tidak memiliki akses ke zona ini.",
      );
    // Calendar dates use Asia/Jakarta, matching the UI, with an exclusive end.
    const start = new Date(`${query.from}T00:00:00+07:00`);
    const end = new Date(Date.parse(`${query.to}T00:00:00+07:00`) + 86_400_000);
    const readings = await db
      .collection<SensorReadingDocument>("sensor_readings")
      .find({
        zoneId: { $in: selected.map((z) => z._id.toHexString()) },
        measuredAt: { $gte: start, $lt: end },
      })
      .sort({ measuredAt: 1 })
      .limit(10_001)
      .toArray();
    if (readings.length > 10_000)
      throw new ApiError(
        422,
        "REDUCE_DATE_RANGE",
        "Data melebihi 10.000 pembacaan. Persempit rentang tanggal.",
      );
    const events = await db
      .collection<IrrigationEventDocument>("irrigation_events")
      .find({
        zoneId: { $in: selected.map((z) => z._id) },
        startedAt: { $gte: start, $lt: end },
      })
      .sort({ startedAt: -1 })
      .limit(201)
      .toArray();
    if (events.length > 200)
      throw new ApiError(
        422,
        "REDUCE_DATE_RANGE",
        "Persempit tanggal untuk menampilkan seluruh kejadian irigasi.",
      );
    return json({
      readings: readings.map((r) => ({
        time: r.measuredAt.toISOString(),
        moisture: r.soilMoisture,
        water: r.waterLevelCm,
        zoneName:
          selected.find((z) => z._id.toHexString() === r.zoneId)?.name ?? "",
      })),
      events: events.map((e) => ({
        id: e._id.toHexString(),
        time: e.startedAt.toISOString(),
        result: e.result,
        trigger: e.trigger,
      })),
    });
  });
}
