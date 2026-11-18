import "server-only";
import { AuthorizationError } from "@/server/auth/policy";
import { currentUser } from "@/server/auth/current-user";
import { getMongoDatabase } from "@/server/db/mongodb";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import { z } from "zod";
import { isSameOrigin } from "./origin";
import { boundedBody, BodyTooLarge } from "./body";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function objectId(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new ApiError(400, "INVALID_ID", "ID tidak valid.");
  return new ObjectId(value);
}
export async function input<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(415, "JSON_REQUIRED", "Gunakan JSON.");
  }
  let text: string;
  try {
    text = await boundedBody(request);
  } catch (error) {
    if (error instanceof BodyTooLarge)
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Data terlalu besar.");
    throw error;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ApiError(400, "INVALID_JSON", "JSON tidak valid.");
  }
  return schema.parse(raw);
}
export const json = (data: unknown, status = 200) =>
  Response.json(
    { data },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export async function api(
  request: Request,
  handler: (user: User, db: Db) => Promise<Response>,
) {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      if (!isSameOrigin(request, process.env.AUTH_URL)) {
        throw new ApiError(
          403,
          "INVALID_ORIGIN",
          "Permintaan harus berasal dari aplikasi ini.",
        );
      }
    }
    const user = await currentUser();
    if (!user)
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Silakan masuk terlebih dahulu.",
      );
    return await handler(user, await getMongoDatabase());
  } catch (error) {
    let status = 503,
      code = "SERVICE_UNAVAILABLE",
      message =
        "Layanan belum tersedia. Periksa koneksi database lalu coba lagi.";
    if (error instanceof ApiError) ({ status, code, message } = error);
    else if (error instanceof AuthorizationError) {
      status = 403;
      code = error.code;
      message = "Anda tidak memiliki akses.";
    } else if (error instanceof z.ZodError) {
      status = 422;
      code = "VALIDATION_ERROR";
      message = "Isian tidak valid. Periksa nilai dan kolom yang diperlukan.";
    } else if (error instanceof MongoServerError && error.code === 11000) {
      status = 409;
      code = "CONFLICT";
      message = "Data tersebut sudah terdaftar.";
    }
    // Never serialize database errors: they can contain hostnames or credentials.
    if (status >= 500)
      console.error({
        event: "api_unavailable",
        path: new URL(request.url).pathname,
        type: error instanceof Error ? error.name : "UnknownError",
      });
    return Response.json(
      { error: { code, message } },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
