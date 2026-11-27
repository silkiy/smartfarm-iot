import type { Db } from "mongodb";
import { auth } from "@/auth";
import { forbidden, notFound, unauthorized } from "./app-error";
import type { DeviceDocument } from "./devices";
import type { UserRole } from "./users";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const DEVICES_COLLECTION = "devices";

/** Require an authenticated session; throws `AppError` 401. */
export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    throw unauthorized();
  }

  return {
    id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role ?? "USER",
  };
}

/** Require an authenticated `ADMIN`; throws 401 / 403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();

  if (user.role !== "ADMIN") {
    throw forbidden("Admin required");
  }

  return user;
}

/**
 * Require read/write access to a device.
 *
 * `USER` may only access devices with `ownerId === session.user.id`; `ADMIN` is
 * global. Unknown `deviceId` -> 404. Cross-user access -> 403 (see note in
 * report about AGENT.md §11.3 which prefers 404 to avoid leaking existence;
 * acceptance T5 requires 403 here). `deviceId` is Zod-validated upstream; the
 * filter uses only a validated scalar (no raw request object -> no NoSQL injection).
 */
export async function requireDeviceAccess(
  deviceId: string,
  db: Db,
  session?: SessionUser,
): Promise<DeviceDocument> {
  const user = session ?? (await requireSession());
  const device = await db
    .collection<DeviceDocument>(DEVICES_COLLECTION)
    .findOne({ deviceId });

  if (!device) {
    throw notFound("Device not found");
  }

  if (user.role !== "ADMIN" && device.ownerId !== user.id) {
    throw forbidden("Not device owner");
  }

  return device;
}
