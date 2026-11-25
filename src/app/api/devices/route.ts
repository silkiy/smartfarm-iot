import { deviceRegistrationSchema } from "@/domain/device";
import { collectionNames } from "@/domain/models";
import { AuthorizationError } from "@/server/auth/policy";
import { getFleetKeyHash } from "@/server/auth/device";
import { api, input, json, objectId } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";

/**
 * POST /api/devices
 * Admin atau pemilik lahan mendaftarkan ESP32 baru via MAC address.
 * Tidak ada API key per device — semua ESP32 pakai DEVICE_FLEET_KEY.
 */
export async function POST(request: Request) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN" && user.role !== "LANDOWNER")
      throw new AuthorizationError();

    const fields = await input(request, deviceRegistrationSchema);

    // Pastikan farm ada dan user berhak mengaksesnya
    await farmAccess(db, user, fields.farmId);

    // Pastikan zone ada di bawah farm tersebut
    const zone = await db.collection(collectionNames.zones).findOne({
      _id: objectId(fields.zoneId),
      farmId: objectId(fields.farmId),
      isActive: true,
      archivedAt: { $exists: false },
    });
    if (!zone)
      return Response.json(
        { error: { code: "ZONE_NOT_FOUND", message: "Zona tidak ditemukan." } },
        { status: 404 },
      );

    // Pastikan DEVICE_FLEET_KEY sudah dikonfigurasi sebelum registrasi
    const fleetKeyHash = getFleetKeyHash();
    const now = new Date();

    await db.collection(collectionNames.devices).insertOne({
      macAddress: fields.macAddress,
      deviceId: fields.deviceId,
      farmId: objectId(fields.farmId),
      zoneId: objectId(fields.zoneId),
      name: fields.name,
      status: "OFFLINE" as const,
      fleetKeyHash,
      createdAt: now,
      updatedAt: now,
    });

    return json(
      {
        deviceId: fields.deviceId,
        macAddress: fields.macAddress,
        message:
          "Device terdaftar. Nyalakan ESP32 — akan otomatis aktif setelah terhubung WiFi.",
      },
      201,
    );
  });
}

/**
 * GET /api/devices
 * Daftar device milik user (admin: semua, pemilik: lahan sendiri).
 */
export async function GET(request: Request) {
  return api(request, async (user, db) => {
    const filter =
      user.role === "ADMIN"
        ? {}
        : {
            farmId: {
              $in: await db
                .collection(collectionNames.farms)
                .find({ ownerUserId: user.id, archivedAt: { $exists: false } })
                .map((f) => f._id)
                .toArray(),
            },
          };

    const devices = await db
      .collection(collectionNames.devices)
      .find(filter, {
        projection: {
          fleetKeyHash: 0, // jangan expose hash ke browser
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return json(
      devices.map((d) => ({
        id: d._id.toHexString(),
        macAddress: d.macAddress,
        deviceId: d.deviceId,
        name: d.name,
        status: d.status,
        lastSeenAt: d.lastSeenAt ?? null,
        farmId: d.farmId.toHexString(),
        zoneId: d.zoneId.toHexString(),
      })),
    );
  });
}
