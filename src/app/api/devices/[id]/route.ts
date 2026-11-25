import { collectionNames, type DeviceDocument } from "@/domain/models";
import { AuthorizationError } from "@/server/auth/policy";
import { api, json, objectId } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";

type Context = { params: Promise<{ id: string }> };

/**
 * DELETE /api/devices/:id
 * Nonaktifkan device (set DISABLED) — tidak hapus riwayat pembacaan.
 * ESP32 yang dinonaktifkan mendapat 403 DEVICE_DISABLED saat provision/ingest.
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
