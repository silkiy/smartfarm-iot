import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-guard";
import { generateApiKey, generateDeviceId, hashApiKey } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import type { DeviceDocument } from "@/lib/devices";
import { createDeviceSchema } from "@/lib/validations/device";

const DEVICES_COLLECTION = "devices";
const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === DUPLICATE_KEY_CODE;
}

export async function POST(request: Request): Promise<Response> {
  // Auth first (AGENT.md §11.3 / §12.1). No ownership input is trusted.
  const session = await requireSession();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiFailure("INVALID_JSON", "Body harus berupa JSON valid.", 400);
  }

  const parsed = createDeviceSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiFailure("VALIDATION_ERROR", "Data perangkat tidak valid.", 400);
  }

  const { name, macAddress } = parsed.data;
  const deviceId = parsed.data.deviceId ?? generateDeviceId();

  try {
    const db = await getDb();
    const devices = db.collection<DeviceDocument>(DEVICES_COLLECTION);

    // Friendly pre-checks; unique indexes remain the source of truth under races.
    // Only validated scalars are used (no raw request -> no NoSQL injection).
    const byDeviceId = await devices.findOne({ deviceId }, { projection: { _id: 1 } });
    if (byDeviceId) {
      return apiFailure("DEVICE_CONFLICT", "deviceId atau macAddress sudah terdaftar.", 409);
    }
    const byMac = await devices.findOne({ macAddress }, { projection: { _id: 1 } });
    if (byMac) {
      return apiFailure("DEVICE_CONFLICT", "deviceId atau macAddress sudah terdaftar.", 409);
    }

    const apiKey = generateApiKey(); // plain-text shown ONCE; only hash persisted
    const apiKeyHash = hashApiKey(apiKey);

    const createdAt = new Date();
    const document: Omit<DeviceDocument, "_id"> & { createdAt: Date; desiredPumpState: boolean } = {
      deviceId,
      ownerId: session.id, // server-set from session; client ownerId ignored
      name,
      macAddress,
      apiKeyHash,
      mode: "AUTO",
      desiredPumpState: false,
      createdAt,
    };

    const result = await devices.insertOne(document);
    const id = result.insertedId.toString();

    // `apiKey` returned exactly once; `apiKeyHash` never in the response.
    return apiSuccess(
      {
        device: {
          id,
          deviceId,
          name,
          macAddress,
          ownerId: session.id,
          mode: "AUTO",
          createdAt,
        },
        apiKey,
      },
      201,
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiFailure("DEVICE_CONFLICT", "deviceId atau macAddress sudah terdaftar.", 409);
    }
    console.error(
      JSON.stringify({
        level: "error",
        message: "create device failed",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return apiFailure("INTERNAL_ERROR", "Terjadi kesalahan. Coba lagi.", 500);
  }
}
