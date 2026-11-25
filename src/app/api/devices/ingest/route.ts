import { ingestSchema } from "@/domain/device";
import { collectionNames } from "@/domain/models";
import { deviceApi, deviceJson } from "@/server/http/device-api";

export async function POST(request: Request) {
  return deviceApi(request, async (device, db) => {
    const payload = ingestSchema.parse(await request.json());

    // Pastikan deviceId di payload cocok dengan device yang terautentikasi
    if (payload.deviceId !== device.deviceId)
      return Response.json(
        {
          error: { code: "DEVICE_MISMATCH", message: "deviceId tidak cocok." },
        },
        { status: 403 },
      );

    const now = new Date();
    await db.collection(collectionNames.sensorReadings).insertOne({
      deviceId: payload.deviceId,
      farmId: device.farmId,
      zoneId: device.zoneId,
      soilMoisture: payload.soilMoisture,
      waterLevelCm: payload.waterLevelCm,
      pumpStatus: payload.pumpStatus,
      valveStatus: payload.valveStatus,
      measuredAt: now,
      requestId: payload.requestId,
      createdAt: now,
      updatedAt: now,
    });

    // Update lastSeenAt dan status device menjadi ONLINE
    await db
      .collection(collectionNames.devices)
      .updateOne(
        { deviceId: device.deviceId },
        { $set: { status: "ONLINE", lastSeenAt: now, updatedAt: now } },
      );

    return deviceJson({ received: true });
  });
}
