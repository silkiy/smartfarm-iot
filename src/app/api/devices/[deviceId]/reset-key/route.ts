import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireDeviceAccess, requireSession } from "@/lib/auth-guard";
import { appErrorToResponse } from "@/lib/app-error-http";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import type { DeviceDocument } from "@/lib/devices";
import { deviceIdParamSchema } from "@/lib/validations/device";

const DEVICES_COLLECTION = "devices";

/**
 * POST /api/devices/[deviceId]/reset-key
 * Generate a NEW one-time `x-api-key`, store only SHA-256 `apiKeyHash`, and
 * invalidate the old key. `apiKeyHash` is never returned; plain key once.
 * Owner/admin only.
 */
export async function POST(
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

    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const result = await db
      .collection<DeviceDocument>(DEVICES_COLLECTION)
      .updateOne({ deviceId: parsed.data }, { $set: { apiKeyHash } });

    if (result.matchedCount === 0) return apiFailure("NOT_FOUND", "Perangkat tidak ditemukan.", 404);

    return apiSuccess({ apiKey }, 200);
  } catch (error) {
    return appErrorToResponse(error);
  }
}
