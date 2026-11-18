import { z } from "zod";
const date = z.iso.date();
export const reportQuerySchema = z
  .object({
    farmId: z.string().regex(/^[a-f\d]{24}$/i),
    zoneId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    from: date,
    to: date,
  })
  .refine(
    (v) => {
      const span = Date.parse(v.to) - Date.parse(v.from);
      return span >= 0 && span <= 30 * 86_400_000;
    },
    { message: "Pilih rentang maksimal 31 hari." },
  );
export type ReportData = {
  readings: {
    time: string;
    moisture: number;
    water: number;
    zoneName: string;
    isDemo?: boolean;
  }[];
  events: {
    id: string;
    time: string;
    result: string;
    trigger: string;
    isDemo?: boolean;
  }[];
};
