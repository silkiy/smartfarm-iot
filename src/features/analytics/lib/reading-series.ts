import { demoReadings } from "@/features/demo/fixtures";
import type { Zone } from "@/features/demo/types";
import type { Reading } from "../types";

type SeriesOptions = {
  range: string;
  startDate: string;
  endDate: string;
  farmId: string;
  zone?: Zone;
};

function getDayCount(
  range: string,
  startDate: string,
  endDate: string,
  badDate: boolean,
): number {
  if (range === "7h") return 7;
  if (range === "30h") return 30;
  if (range === "custom" && !badDate) {
    return Math.min(
      31,
      Math.floor((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) +
        1,
    );
  }
  return 1;
}

/** Deterministic preview data, kept separate from presentation and future API reads. */
export function createReadingSeries({
  range,
  startDate,
  endDate,
  farmId,
  zone,
}: SeriesOptions) {
  const badDate =
    range === "custom" && (!startDate || !endDate || endDate < startDate);
  const days = getDayCount(range, startDate, endDate, badDate);
  const offset = zone
    ? Math.round((zone.moisture - 60) / 3)
    : farmId === "farm-b"
      ? 4
      : 0;
  let readings: Reading[];

  if (range === "24j") {
    readings = demoReadings.map((reading) => ({
      ...reading,
      moisture: Math.max(0, Math.min(100, reading.moisture + offset)),
      water: Number(Math.max(0, reading.water + offset / 10).toFixed(1)),
    }));
  } else {
    readings = Array.from({ length: days }, (_, index) => {
      const date = new Date(
        `${range === "custom" ? startDate : "2026-11-18"}T12:00:00Z`,
      );
      date.setUTCDate(
        date.getUTCDate() + (range === "custom" ? index : index - days + 1),
      );
      return {
        time: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        }),
        moisture: 54 + ((index * 7) % 23) + offset,
        water: Number((4.2 + ((index * 3) % 26) / 10 + offset / 10).toFixed(1)),
      };
    });
  }

  const average =
    readings.reduce((sum, reading) => sum + reading.moisture, 0) /
    Math.max(1, readings.length);
  return { readings, badDate, days, average };
}
