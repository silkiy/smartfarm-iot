export type DemoRole = "Pemilik lahan" | "Admin" | "Pekerja lapangan";
export type Farm = {
  id: string;
  name: string;
  location: string;
  area: string;
  phase: string;
};
export type Zone = {
  id: string;
  farmId: string;
  name: string;
  moisture: number;
  water: number;
  online: boolean;
  hasReading?: boolean;
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
