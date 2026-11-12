import type {
  FarmDocument,
  UserRole,
  ZoneDocument,
} from "@/domain/models";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export type ZoneAction = "READ" | "CONTROL";

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor() {
    super("You are not authorized to access this resource");
  }
}

export function assertFarmAccess(
  user: AuthenticatedUser,
  farm: Pick<FarmDocument, "ownerUserId">,
): void {
  if (user.role === "ADMIN") {
    return;
  }

  if (user.role === "LANDOWNER" && farm.ownerUserId === user.id) {
    return;
  }

  throw new AuthorizationError();
}

export function assertZoneAccess(
  user: AuthenticatedUser,
  farm: Pick<FarmDocument, "ownerUserId">,
  zone: Pick<ZoneDocument, "assignedUserIds" | "controlUserIds">,
  action: ZoneAction,
): void {
  if (user.role === "ADMIN") {
    return;
  }

  if (user.role === "LANDOWNER" && farm.ownerUserId === user.id) {
    return;
  }

  const isAssigned = zone.assignedUserIds.includes(user.id);
  const canControl = zone.controlUserIds.includes(user.id);
  if (user.role === "FIELD_WORKER" && isAssigned && (action === "READ" || canControl)) {
    return;
  }

  throw new AuthorizationError();
}
