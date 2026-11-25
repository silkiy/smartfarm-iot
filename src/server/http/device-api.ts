import "server-only";
import { getMongoDatabase } from "@/server/db/mongodb";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { authenticateDevice } from "@/server/auth/device";
import type { AuthenticatedDevice } from "@/server/auth/device";

export class DeviceApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const deviceJson = (data: unknown, status = 200) =>
  Response.json({ data }, { status });

/**
 * Handler khusus endpoint device — tidak pakai sesi Auth.js,
 * autentikasi via X-Device-Key header.
 */
export async function deviceApi(
  request: Request,
  handler: (
    device: AuthenticatedDevice,
    db: Awaited<ReturnType<typeof getMongoDatabase>>,
  ) => Promise<Response>,
) {
  try {
    const db = await getMongoDatabase();
    const device = await authenticateDevice(request, db);
    if (!device)
      throw new DeviceApiError(
        401,
        "DEVICE_UNAUTHORIZED",
        "Kredensial perangkat tidak valid.",
      );
    return await handler(device, db);
  } catch (error) {
    let status = 503,
      code = "SERVICE_UNAVAILABLE",
      message = "Layanan belum tersedia.";
    if (error instanceof DeviceApiError) ({ status, code, message } = error);
    else if (error instanceof z.ZodError) {
      status = 422;
      code = "VALIDATION_ERROR";
      message = "Data sensor tidak valid.";
    } else if (error instanceof MongoServerError && error.code === 11000) {
      // requestId duplikat — idempotent, kembalikan 200
      return Response.json({ data: { duplicate: true } }, { status: 200 });
    } else {
      console.error({
        event: "device_api_error",
        type: error instanceof Error ? error.name : "UnknownError",
      });
    }
    return Response.json({ error: { code, message } }, { status });
  }
}
