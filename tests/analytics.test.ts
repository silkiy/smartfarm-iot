import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reportQuerySchema } from "../src/domain/report";
import { createReportCsv } from "../src/features/analytics/lib/report-csv";

describe("report date filters", () => {
  const input = {
    farmId: "507f1f77bcf86cd799439011",
    from: "2026-11-01",
    to: "2026-11-18",
  };
  it("accepts calendar dates and an accessible-resource ID contract", () =>
    assert.equal(reportQuerySchema.safeParse(input).success, true));
  it("rejects reversed, overlong, and invalid dates", () => {
    for (const change of [
      { from: "2026-11-19" },
      { from: "2026-01-01" },
      { from: "invalid" },
    ])
      assert.equal(
        reportQuerySchema.safeParse({ ...input, ...change }).success,
        false,
      );
  });
  it("rejects malformed IDs", () =>
    assert.equal(
      reportQuerySchema.safeParse({ ...input, zoneId: "other" }).success,
      false,
    ));
});

describe("stored report CSV", () => {
  const readings = [{ time: "08.00", moisture: 66, water: 6.5 }];
  it("labels exported data and includes exactly the selected readings", () => {
    const csv = createReportCsv({ farmName: "Blok A", readings });
    assert.ok(csv.startsWith("\uFEFFJenis data,"));
    assert.equal(csv.split("\r\n").length, 2);
    assert.ok(
      csv.includes('"TERSIMPAN","Blok A","Semua petak","08.00","66","6.5"'),
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
