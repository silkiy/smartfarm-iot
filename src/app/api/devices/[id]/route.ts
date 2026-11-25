import { collectionNames, type DeviceDocument } from "@/domain/models";
import { AuthorizationError } from "@/server/auth/policy";
import { generateDeviceKey } from "@/server/auth/device";
import { api, json, objectId } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/devices/:id/rotate-key
 * Generate ulang API key — key lama langsung tidak berlaku.
 */
export async function POST(request: Request, context: Context) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN" && user.role !== "LANDOWNER")
      throw new AuthorizationError();

    const { id } = await context.params;
    const device = await db
      .collection<DeviceDocument>(collectionNames.devices)
      .findOne({ _id: objectId(id) });

    if (!device)
      return Response.json(
        {
          error: {
            code: "DEVICE_NOT_FOUND",
            message: "Perangkat tidak ditemukan.",
          },
        },
        { status: 404 },
      );

    // Pastikan user berhak atas farm yang memiliki device ini
    await farmAccess(db, user, device.farmId.toHexString());

    const { plaintext, hash } = generateDeviceKey();
    await db.collection(collectionNames.devices).updateOne(
      { _id: device._id },
      {
        $set: {
          credentialHash: hash,
          status: "OFFLINE" as const,
          updatedAt: new Date(),
        },
      },
    );

    return json({ deviceId: device.deviceId, apiKey: plaintext });
  });
}

/**
 * DELETE /api/devices/:id
 * Nonaktifkan device (set DISABLED) — tidak hapus riwayat pembacaan.
 */
export async function DELETE(request: Request, context: Context) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN" && user.role !== "LANDOWNER")
      throw new AuthorizationError();

    const { id } = await context.params;
    const device = await db
      .collection<DeviceDocument>(collectionNames.devices)
      .findOne({ _id: objectId(id) });

    if (!device)
      return Response.json(
        {
          error: {
            code: "DEVICE_NOT_FOUND",
            message: "Perangkat tidak ditemukan.",
          },
        },
        { status: 404 },
      );

    await farmAccess(db, user, device.farmId.toHexString());

    await db
      .collection(collectionNames.devices)
      .updateOne(
        { _id: device._id },
        { $set: { status: "DISABLED" as const, updatedAt: new Date() } },
      );

    return json({ id });
  });
}
