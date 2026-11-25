import { provisionRequestSchema } from "@/domain/device";
import { collectionNames, type DeviceDocument } from "@/domain/models";
import { provisionApi, deviceJson } from "@/server/http/device-api";

/**
 * POST /api/devices/provision
 *
 * ESP32 memanggil ini setiap kali pertama nyala atau belum punya config.
 * Header: X-Fleet-Key
 * Body:   { macAddress: "AA:BB:CC:DD:EE:FF" }
 *
 * Response sukses: { deviceId, farmId, zoneId }
 * Response belum terdaftar: 403 DEVICE_NOT_PROVISIONED
 * Response dinonaktifkan:   403 DEVICE_DISABLED
 */
export async function POST(request: Request) {
  return provisionApi(request, async (db) => {
    const body = await request.json();
    const parsed = provisionRequestSchema.safeParse(body);

    if (!parsed.success)
      return Response.json(
        {
          error: {
            code: "INVALID_MAC",
            message: "MAC address tidak valid. Format: AA:BB:CC:DD:EE:FF",
          },
        },
        { status: 422 },
      );

    const { macAddress } = parsed.data;

    const device = await db
      .collection<DeviceDocument>(collectionNames.devices)
      .findOne({ macAddress });

    if (!device)
      return Response.json(
        {
          error: {
            code: "DEVICE_NOT_PROVISIONED",
            message:
              "Device belum terdaftar. Daftarkan MAC address di dashboard.",
          },
        },
        { status: 403 },
      );

    if (device.status === "DISABLED")
      return Response.json(
        {
          error: {
            code: "DEVICE_DISABLED",
            message: "Device dinonaktifkan oleh admin.",
          },
        },
        { status: 403 },
      );

    // Update lastSeenAt
    await db
      .collection(collectionNames.devices)
      .updateOne(
        { macAddress },
        { $set: { lastSeenAt: new Date(), updatedAt: new Date() } },
      );

    return deviceJson({
      deviceId: device.deviceId,
      farmId: device.farmId.toHexString(),
      zoneId: device.zoneId.toHexString(),
    });
  });
}
