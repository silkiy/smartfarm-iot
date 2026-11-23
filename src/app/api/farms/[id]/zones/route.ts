import { zoneInputSchema } from "@/domain/workspace";
import { api, input, json } from "@/server/http/api";
import { farmAccess } from "@/server/workspace/access";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const farm = await farmAccess(db, user, id);
    const fields = await input(request, zoneInputSchema);
    const now = new Date();
    const result = await db.collection("zones").insertOne({
      ...fields,
      farmId: farm._id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return json({ id: result.insertedId.toHexString() }, 201);
  });
}
