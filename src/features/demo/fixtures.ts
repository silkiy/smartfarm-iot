import type { Farm, IrrigationRule, Notice, Zone } from "./types";

export const defaultRule: IrrigationRule = {
  enabled: false,
  phase: "Vegetatif",
  threshold: 40,
  target: 8,
  schedule: "06:00",
};

export const initialFarms: Farm[] = [
  {
    id: "farm-a",
    name: "Sawah Padi Blok A",
    location: "Tikung, Lamongan",
    area: "2.500",
    phase: "Vegetatif",
  },
  {
    id: "farm-b",
    name: "Sawah Padi Blok B",
    location: "Tikung, Lamongan",
    area: "1.800",
    phase: "Generatif",
  },
];
export const initialZones: Zone[] = [
  {
    id: "zone-1",
    farmId: "farm-a",
    name: "Petak Barat",
    moisture: 70,
    water: 6.2,
    online: true,
  },
  {
    id: "zone-2",
    farmId: "farm-a",
    name: "Petak Timur",
    moisture: 38,
    water: 3.4,
    online: true,
  },
  {
    id: "zone-3",
    farmId: "farm-a",
    name: "Petak Tengah",
    moisture: 68,
    water: 5.8,
    online: false,
  },
  {
    id: "zone-4",
    farmId: "farm-b",
    name: "Petak Utara",
    moisture: 64,
    water: 5.6,
    online: true,
  },
  {
    id: "zone-5",
    farmId: "farm-b",
    name: "Petak Selatan",
    moisture: 72,
    water: 6.8,
    online: true,
  },
];
export const initialNotices: Notice[] = [
  {
    id: "notice-1",
    title: "Petak Timur mulai kering",
    message:
      "Kelembapan 38% dan ketinggian air 3,4 cm. Periksa kondisi petak sebelum memulai irigasi.",
    time: "10.45 WIB",
    category: "Peringatan",
    read: false,
  },
  {
    id: "notice-2",
    title: "Perangkat Petak Tengah terputus",
    message:
      "Data terakhir diterima 10 menit lalu. Nilai sensor yang ditampilkan mungkin sudah berubah.",
    time: "10.35 WIB",
    category: "Sistem",
    read: false,
  },
  {
    id: "notice-3",
    title: "Irigasi Petak Barat selesai",
    message:
      "Contoh siklus irigasi selesai dalam 10 detik. Pompa mati dan katup tertutup.",
    time: "09.42 WIB",
    category: "Irigasi",
    read: true,
  },
  {
    id: "notice-4",
    title: "Batas durasi bekerja",
    message:
      "Contoh pengaman menghentikan pompa setelah batas 15 detik tercapai.",
    time: "Kemarin",
    category: "Peringatan",
    read: true,
  },
];
export const demoReadings = [
  { time: "00.00", moisture: 48, water: 3.2 },
  { time: "04.00", moisture: 43, water: 2.8 },
  { time: "08.00", moisture: 66, water: 6.5 },
  { time: "12.00", moisture: 72, water: 7.2 },
  { time: "16.00", moisture: 61, water: 5.4 },
  { time: "20.00", moisture: 68, water: 6.1 },
];
