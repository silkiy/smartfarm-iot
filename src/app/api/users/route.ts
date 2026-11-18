import { randomUUID } from "node:crypto";
import { userInputSchema } from "@/domain/workspace";
import { AuthorizationError } from "@/server/auth/policy";
import { hashPassword } from "@/server/auth/passwords";
import { api, input, json } from "@/server/http/api";
export async function GET(request: Request) {
  return api(request, async (user, db) => {
    if (user.role === "FIELD_WORKER") throw new AuthorizationError();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
    const query =
      user.role === "ADMIN" ? {} : { role: "FIELD_WORKER", isActive: true };
    const collection = db.collection("profiles");
    const items = await collection
      .find(query, {
        projection: {
          _id: 0,
          userId: 1,
          displayName: 1,
          email: 1,
          role: 1,
          isActive: 1,
        },
      })
      .sort({ displayName: 1 })
      .skip((page - 1) * 100)
      .limit(100)
      .toArray();
    return json({
      items,
      page,
      pageSize: 100,
      total: await collection.countDocuments(query),
    });
  });
}
export async function POST(request: Request) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN") throw new AuthorizationError();
    const { password, ...fields } = await input(request, userInputSchema);
    const userId = randomUUID(),
      now = new Date();
    await db.collection("profiles").insertOne({
      ...fields,
      userId,
      passwordHash: await hashPassword(password),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return json({ id: userId }, 201);
  });
}
