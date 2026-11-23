import { zoneInputSchema } from "@/domain/workspace";
import { api, input, json } from "@/server/http/api";
import { zoneAccess } from "@/server/workspace/access";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const { zone } = await zoneAccess(db, user, id);
    const fields = await input(request, zoneInputSchema);
    await db
      .collection("zones")
      .updateOne(
        { _id: zone._id },
        { $set: { ...fields, updatedAt: new Date() } },
      );
    return json({ id });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const { zone } = await zoneAccess(db, user, id);
    await db.collection("zones").updateOne(
      { _id: zone._id },
      {
        $set: {
          archivedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        },
      },
    );
    return json({ id });
  });
}
