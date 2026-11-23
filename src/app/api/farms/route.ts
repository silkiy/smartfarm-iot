import { farmInputSchema } from "@/domain/workspace";
import { parsePage } from "@/domain/pagination";
import { AuthorizationError } from "@/server/auth/policy";
import { api, input, json } from "@/server/http/api";
import { visibleResources } from "@/server/workspace/access";
export async function GET(request: Request) {
  return api(request, async (user, db) => {
    const page = parsePage(new URL(request.url).searchParams);
    const { farms } = await visibleResources(db, user);
    return json({
      items: farms
        .slice((page - 1) * 20, page * 20)
        .map((f) => ({ ...f, _id: undefined, id: f._id.toHexString() })),
      page,
      total: farms.length,
      pageSize: 20,
    });
  });
}
export async function POST(request: Request) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN" && user.role !== "LANDOWNER")
      throw new AuthorizationError();
    const fields = await input(request, farmInputSchema);
    const now = new Date();
    const result = await db.collection("farms").insertOne({
      ...fields,
      ownerUserId: user.id,
      createdAt: now,
      updatedAt: now,
    });
    return json({ id: result.insertedId.toHexString() }, 201);
  });
}
