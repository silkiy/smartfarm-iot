import type { UserRole } from "@/domain/models";
export type WorkspaceRole = "Pemilik lahan" | "Admin" | "Pekerja lapangan";
export type Farm = {
  id: string;
  name: string;
  location: string;
  area: string;
  phase: string;
  ownerUserId: string;
  latitude?: number | null;
  longitude?: number | null;
};
export type Zone = {
  id: string;
  farmId: string;
  name: string;
  moisture: number;
  water: number;
  online: boolean;
  hasReading: boolean;
  assignedUserIds: string[];
  controlUserIds: string[];
};
export type Notice = {
  id: string;
  title: string;
  message: string;
  time: string;
  category: "Peringatan" | "Irigasi" | "Sistem";
  read: boolean;
};
export type IrrigationRule = {
  enabled: boolean;
  phase: string;
  threshold: number;
  target: number;
  schedule: string;
};
export const defaultRule: IrrigationRule = {
  enabled: false,
  phase: "Vegetatif",
  threshold: 40,
  target: 8,
  schedule: "06:00",
};
export type Account = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
export type WorkspaceSnapshot = {
  user: Account;
  farms: Farm[];
  zones: Zone[];
  rules: Record<string, IrrigationRule>;
  notices: Notice[];
  preferences: { web: boolean; whatsapp: boolean };
};
