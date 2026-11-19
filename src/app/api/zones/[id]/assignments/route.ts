import { assignmentSchema } from "@/domain/workspace";
import { api, ApiError, input, json } from "@/server/http/api";
import { zoneAccess } from "@/server/workspace/access";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const { zone } = await zoneAccess(db, user, id, true);
    const fields = await input(request, assignmentSchema);
    const ids = [...new Set(fields.assignedUserIds)];
    const count = await db.collection("profiles").countDocuments({
      userId: { $in: ids },
      role: "FIELD_WORKER",
      isActive: true,
    });
    if (count !== ids.length)
      throw new ApiError(
        422,
        "INVALID_WORKER",
        "Penugasan hanya untuk pekerja aktif.",
      );
    await db
      .collection("zones")
      .updateOne(
        { _id: zone._id },
        { $set: { ...fields, updatedAt: new Date() } },
      );
    return json({ id });
  });
}
