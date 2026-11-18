import { api, ApiError, json } from "@/server/http/api";
import { fetchWeather } from "@/server/integrations/weather";
import { visibleResources } from "@/server/workspace/access";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    if (process.env.WEATHER_ENABLED === "false")
      throw new ApiError(
        503,
        "WEATHER_DISABLED",
        "Layanan cuaca dinonaktifkan administrator.",
      );
    const { id } = await context.params;
    const { farms } = await visibleResources(db, user);
    const farm = farms.find((f) => f._id.toHexString() === id);
    if (!farm)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Lahan tidak tersedia untuk akun Anda.",
      );
    if (farm.latitude == null || farm.longitude == null)
      throw new ApiError(
        422,
        "COORDINATES_REQUIRED",
        "Isi koordinat lahan untuk melihat cuaca.",
      );
    const recent = await db.collection("weather_records").findOne(
      {
        farmId: farm._id,
        latitude: farm.latitude,
        longitude: farm.longitude,
        fetchedAt: { $gte: new Date(Date.now() - 10 * 60_000) },
      },
      { sort: { fetchedAt: -1 }, projection: { _id: 0 } },
    );
    if (recent) return json(recent);
    const weather = await fetchWeather(farm.latitude, farm.longitude);
    await db.collection("weather_records").insertOne({
      ...weather,
      farmId: farm._id,
      latitude: farm.latitude,
      longitude: farm.longitude,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return json(weather);
  });
}
