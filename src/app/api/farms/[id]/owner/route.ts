import { z } from "zod";
import { AuthorizationError } from "@/server/auth/policy";
import { api, ApiError, input, json } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN") throw new AuthorizationError();
    const { id } = await context.params;
    const farm = await farmAccess(db, user, id);
    const { ownerUserId } = await input(
      request,
      z.object({ ownerUserId: z.string().uuid() }).strict(),
    );
    const owner = await db.collection("profiles").findOne({
      userId: ownerUserId,
      isActive: true,
      role: { $in: ["LANDOWNER", "ADMIN"] },
    });
    if (!owner)
      throw new ApiError(
        422,
        "INVALID_OWNER",
        "Pilih pemilik lahan atau admin aktif.",
      );
    await db
      .collection("farms")
      .updateOne(
        { _id: farm._id },
        { $set: { ownerUserId, updatedAt: new Date() } },
      );
    return json({ id });
  });
}
