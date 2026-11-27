import "server-only";
import { auth } from "@/auth";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}
