import { apiFailure, apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import type { UserDocument } from "@/lib/users";
import { registerSchema } from "@/lib/validations/auth";

const USERS_COLLECTION = "users";

/** AGENT.md §12.4: rate-limit `/api/auth/register`. */
const REGISTER_RATE_LIMIT = 5;
const REGISTER_RATE_WINDOW_MS = 15 * 60 * 1000;

/** MongoDB duplicate-key error code. */
const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_CODE
  );
}

function logServerError(message: string, error: unknown): void {
  // Structured log; never include password, passwordHash, or connection strings.
  console.error(
    JSON.stringify({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

export async function POST(request: Request): Promise<Response> {
  const limited = rateLimit(
    clientKey(request, "register"),
    REGISTER_RATE_LIMIT,
    REGISTER_RATE_WINDOW_MS,
  );
  if (!limited.allowed) {
    return apiFailure("RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.", 429, {
      "Retry-After": String(limited.retryAfterSeconds),
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiFailure("INVALID_JSON", "Body harus berupa JSON valid.", 400);
  }

  const parsed = registerSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiFailure("VALIDATION_ERROR", "Data registrasi tidak valid.", 400);
  }

  const { name, email, password } = parsed.data;

  try {
    const db = await getDb();
    const users = db.collection<UserDocument>(USERS_COLLECTION);

    // Friendly pre-check; the unique index remains the source of truth under races.
    const existing = await users.findOne({ email }, { projection: { _id: 1 } });
    if (existing) {
      return apiFailure("EMAIL_TAKEN", "Email sudah terdaftar.", 409);
    }

    const passwordHash = await hashPassword(password);
    const document: Omit<UserDocument, "_id"> = {
      name,
      email,
      passwordHash,
      role: "USER", // server-set; any client-sent role is ignored
      createdAt: new Date(),
    };

    const result = await users.insertOne(document);

    // No passwordHash (or any other internal field) in the response.
    return apiSuccess(
      { id: result.insertedId.toString(), name, email, role: "USER" as const },
      201,
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiFailure("EMAIL_TAKEN", "Email sudah terdaftar.", 409);
    }
    logServerError("register failed", error);
    return apiFailure("INTERNAL_ERROR", "Terjadi kesalahan. Coba lagi.", 500);
  }
}
