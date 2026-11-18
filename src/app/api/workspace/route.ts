import { api, json } from "@/server/http/api";
import { workspaceSnapshot } from "@/server/workspace/snapshot";
export async function GET(request: Request) {
  return api(request, async (user, db) =>
    json(await workspaceSnapshot(db, user)),
  );
}
