import { apiFailure } from "@/lib/api-response";
import { requireDeviceAccess, requireSession } from "@/lib/auth-guard";
import { appErrorToResponse } from "@/lib/app-error-http";
import { getDb } from "@/lib/db";
import type { DeviceDocument } from "@/lib/devices";
import { deviceIdParamSchema } from "@/lib/validations/device";

const DEVICES_COLLECTION = "devices";

/** DELETE /api/devices/[deviceId] — remove a device; old API key rejected (row gone). Owner/admin only. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
): Promise<Response> {
  try {
    const session = await requireSession();
    const rawParams = await params;
    const parsed = deviceIdParamSchema.safeParse(rawParams.deviceId);
    if (!parsed.success) return apiFailure("VALIDATION_ERROR", "ID perangkat tidak valid.", 400);

    const db = await getDb();
    await requireDeviceAccess(parsed.data, db, session);

    const result = await db.collection<DeviceDocument>(DEVICES_COLLECTION).deleteOne({ deviceId: parsed.data });
    if (result.deletedCount === 0) return apiFailure("NOT_FOUND", "Perangkat tidak ditemukan.", 404);

    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return appErrorToResponse(error);
  }
}
