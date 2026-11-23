import type { UserRole } from "@/domain/models";

export type Person = {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export const personRoleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  LANDOWNER: "Pemilik lahan",
};
