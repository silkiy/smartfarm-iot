import { preferencesSchema } from "@/domain/workspace";
import { api, input, json } from "@/server/http/api";
export async function PUT(request: Request) {
  return api(request, async (user, db) => {
    const preferences = await input(request, preferencesSchema);
    await db
      .collection("profiles")
      .updateOne(
        { userId: user.id, isActive: true },
        { $set: { preferences, updatedAt: new Date() } },
      );
    return json(preferences);
  });
}
