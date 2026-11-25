import "server-only";
import { getMongoDatabase } from "@/server/db/mongodb";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import {
  authenticateDevice,
  DeviceNotProvisionedError,
  DeviceDisabledError,
  type AuthenticatedDevice,
} from "@/server/auth/device";

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

type Db = Awaited<ReturnType<typeof getMongoDatabase>>;

/**
 * Handler khusus endpoint device.
 * Autentikasi via X-Fleet-Key + X-Mac-Address header (bukan sesi Auth.js).
 */
export async function deviceApi(
  request: Request,
  handler: (device: AuthenticatedDevice, db: Db) => Promise<Response>,
) {
  try {
    const db = await getMongoDatabase();
    const device = await authenticateDevice(request, db);
    return await handler(device, db);
  } catch (error) {
    if (error instanceof DeviceNotProvisionedError)
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 403 },
      );
    if (error instanceof DeviceDisabledError)
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 403 },
      );
    if (error instanceof DeviceApiError)
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    if (error instanceof z.ZodError)
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data sensor tidak valid.",
          },
        },
        { status: 422 },
      );
    if (error instanceof MongoServerError && error.code === 11000)
      // requestId duplikat — idempotent, kembalikan 200
      return Response.json({ data: { duplicate: true } }, { status: 200 });

    console.error({
      event: "device_api_error",
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Layanan belum tersedia.",
        },
      },
      { status: 503 },
    );
  }
}

/**
 * Handler khusus endpoint provisioning — hanya verifikasi fleet key,
 * belum perlu MAC terdaftar di DB.
 */
export async function provisionApi(
  request: Request,
  handler: (db: Db) => Promise<Response>,
) {
  try {
    const fleetKey = request.headers.get("X-Fleet-Key");
    if (!fleetKey)
      return Response.json(
        {
          error: {
            code: "DEVICE_NOT_PROVISIONED",
            message: "Fleet key tidak ada.",
          },
        },
        { status: 403 },
      );

    const { hashFleetKey, getFleetKeyHash } =
      await import("@/server/auth/device");
    if (hashFleetKey(fleetKey) !== getFleetKeyHash())
      return Response.json(
        {
          error: {
            code: "DEVICE_NOT_PROVISIONED",
            message: "Fleet key tidak valid.",
          },
        },
        { status: 403 },
      );

    const db = await getMongoDatabase();
    return await handler(db);
  } catch (error) {
    console.error({
      event: "provision_api_error",
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Layanan belum tersedia.",
        },
      },
      { status: 503 },
    );
  }
}
