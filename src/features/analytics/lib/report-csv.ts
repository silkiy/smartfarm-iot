import type { Reading } from "../types";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // Quoting alone does not stop spreadsheet applications interpreting formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createReportCsv({
  farmName,
  zoneName,
  readings,
}: {
  farmName?: string;
  zoneName?: string;
  readings: Reading[];
}): string {
  const header =
    "\uFEFFJenis data,Lahan,Zona,Waktu,Kelembapan (%),Ketinggian air (cm)\r\n";
  const rows = readings.map((reading) =>
    [
      "CONTOH",
      farmName,
      zoneName ?? "Semua petak",
      reading.time,
      reading.moisture,
      reading.water,
    ]
      .map(csvCell)
      .join(","),
  );
  return header + rows.join("\r\n");
}
