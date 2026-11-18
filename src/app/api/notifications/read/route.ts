import { z } from "zod";
import { api, input, json, objectId } from "@/server/http/api";
import { workspaceSnapshot } from "@/server/workspace/snapshot";
export async function PATCH(request: Request) {
  return api(request, async (user, db) => {
    const { ids } = await input(
      request,
      z
        .object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(100) })
        .strict(),
    );
    const snapshot = await workspaceSnapshot(db, user);
    const visible = new Set(snapshot.notices.map((n) => n.id));
    await db.collection("alerts").updateMany(
      { _id: { $in: ids.filter((id) => visible.has(id)).map(objectId) } },
      {
        $addToSet: { readByUserIds: user.id },
        $set: { updatedAt: new Date() },
      },
    );
    return json({ updated: ids.filter((id) => visible.has(id)).length });
  });
}
