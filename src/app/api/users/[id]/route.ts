import { z } from "zod";
import { AuthorizationError } from "@/server/auth/policy";
import { hashPassword } from "@/server/auth/passwords";
import { api, ApiError, input, json } from "@/server/http/api";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN") throw new AuthorizationError();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const profile = await db.collection("profiles").findOne({ userId: id });
    if (!profile)
      throw new ApiError(404, "USER_NOT_FOUND", "Pengguna tidak ditemukan.");
    if (profile.role === "ADMIN")
      throw new ApiError(
        403,
        "ADMIN_PROTECTED",
        "Akun administrator dikelola melalui prosedur administrator.",
      );
    const fields = await input(
      request,
      z
        .object({
          isActive: z.boolean().optional(),
          password: z
            .string()
            .min(12)
            .max(72)
            .refine((value) => new TextEncoder().encode(value).length <= 72)
            .optional(),
        })
        .strict()
        .refine((v) => v.isActive !== undefined || v.password !== undefined),
    );
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (fields.isActive !== undefined) patch.isActive = fields.isActive;
    if (fields.password)
      patch.passwordHash = await hashPassword(fields.password);
    await db.collection("profiles").updateOne(
      { userId: id },
      {
        $set: patch,
        ...(fields.password || fields.isActive === false
          ? { $inc: { sessionVersion: 1 } }
          : {}),
      },
    );
    return json({ id });
  });
}
