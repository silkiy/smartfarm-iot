import { farmInputSchema } from "@/domain/workspace";
import { api, input, json } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const farm = await farmAccess(db, user, id);
    const fields = await input(request, farmInputSchema);
    await db
      .collection("farms")
      .updateOne(
        { _id: farm._id, archivedAt: { $exists: false } },
        { $set: { ...fields, updatedAt: new Date() } },
      );
    return json({ id });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const farm = await farmAccess(db, user, id);
    // Archiving the parent is atomic; every child query also checks the parent.
    // Historical readings remain available for later retention/export policy.
    await db
      .collection("farms")
      .updateOne(
        { _id: farm._id },
        { $set: { archivedAt: new Date(), updatedAt: new Date() } },
      );
    return json({ id });
  });
}
