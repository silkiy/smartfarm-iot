import { ingestSchema } from "@/domain/device";
import { collectionNames } from "@/domain/models";
import { deviceApi, deviceJson } from "@/server/http/device-api";

export async function POST(request: Request) {
  return deviceApi(request, async (device, db) => {
    const payload = ingestSchema.parse(await request.json());

    // Pastikan MAC di body cocok dengan MAC yang terautentikasi di header
    if (payload.macAddress !== device.macAddress)
      return Response.json(
        {
          error: {
            code: "MAC_MISMATCH",
            message: "MAC address tidak cocok dengan kredensial.",
          },
        },
        { status: 403 },
      );

    const now = new Date();
    await db.collection(collectionNames.sensorReadings).insertOne({
      deviceId: device.deviceId,
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

    // Update status device menjadi ONLINE
    await db
      .collection(collectionNames.devices)
      .updateOne(
        { macAddress: device.macAddress },
        { $set: { status: "ONLINE", lastSeenAt: now, updatedAt: now } },
      );

    return deviceJson({ received: true });
  });
}
