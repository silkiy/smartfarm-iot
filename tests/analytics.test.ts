import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReadingSeries } from "../src/features/analytics/lib/reading-series";
import { createReportCsv } from "../src/features/analytics/lib/report-csv";

const options = {
  range: "24j",
  farmId: "farm-a",
  startDate: "2026-11-12",
  endDate: "2026-11-18",
};

describe("analytics preview series", () => {
  it("keeps the six daily samples and calculates their mean", () => {
    const series = createReadingSeries(options);
    assert.equal(series.readings.length, 6);
    assert.equal(series.readings[0].time, "00.00");
    assert.equal(series.average, (48 + 43 + 66 + 72 + 61 + 68) / 6);
    assert.equal(series.badDate, false);
  });
  it("generates the selected weekly/monthly range", () => {
    assert.equal(
      createReadingSeries({ ...options, range: "7h" }).readings.length,
      7,
    );
    assert.equal(
      createReadingSeries({ ...options, range: "30h" }).readings.length,
      30,
    );
  });
  it("includes both dates and limits custom previews to 31 samples", () => {
    assert.equal(
      createReadingSeries({ ...options, range: "custom" }).readings.length,
      7,
    );
    assert.equal(
      createReadingSeries({
        ...options,
        range: "custom",
        startDate: "2026-01-01",
      }).readings.length,
      31,
    );
  });
  it("flags missing or reversed custom dates", () => {
    assert.ok(
      createReadingSeries({
        ...options,
        range: "custom",
        endDate: "2026-11-01",
      }).badDate,
    );
    assert.ok(
      createReadingSeries({ ...options, range: "custom", endDate: "" }).badDate,
    );
  });
});

describe("sample report CSV", () => {
  const readings = [{ time: "08.00", moisture: 66, water: 6.5 }];
  it("labels exported data and includes exactly the selected readings", () => {
    const csv = createReportCsv({ farmName: "Blok A", readings });
    assert.ok(csv.startsWith("\uFEFFJenis data,"));
    assert.equal(csv.split("\r\n").length, 2);
    assert.ok(
      csv.includes('"CONTOH","Blok A","Semua petak","08.00","66","6.5"'),
    );
  });
  it("escapes quoted names and neutralizes spreadsheet formulas", () => {
    const csv = createReportCsv({
      farmName: '=HYPERLINK("contoh")',
      zoneName: 'Petak "Barat"',
      readings,
    });
    assert.ok(csv.includes('"\'=HYPERLINK(""contoh"")"'));
    assert.ok(csv.includes('"Petak ""Barat"""'));
  });
});
