import assert from "node:assert/strict";
import { test } from "node:test";
import { createChartLayout } from "../src/features/analytics/lib/chart-layout";

test("a single reading is centered and never implies a falling trend", () => {
  const chart = createChartLayout(
    [{ time: "08.00", moisture: 35, water: 3 }],
    "moisture",
    800,
    300,
  );
  assert.equal(chart.points.length, 1);
  assert.equal(chart.points[0].x, (chart.left + chart.right) / 2);
  assert.equal(chart.areaPath, null);
  assert.ok(!chart.linePath.includes("L"));
});
test("chart geometry fits narrow and wide screens with readable label counts", () => {
  const readings = Array.from({ length: 24 }, (_, i) => ({
    time: String(i),
    moisture: i * 4,
    water: i / 2,
  }));
  for (const width of [216, 600, 1440]) {
    const chart = createChartLayout(readings, "water", width, 300);
    assert.equal(chart.points[0].x, chart.left);
    assert.equal(chart.points.at(-1)?.x, chart.right);
    assert.ok(
      chart.points.every(
        (p) => p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= 300,
      ),
    );
    assert.equal(chart.labelIndexes[0], 0);
    assert.equal(chart.labelIndexes.at(-1), 23);
    assert.ok(
      chart.labelIndexes.length <=
        Math.max(2, Math.floor((chart.right - chart.left) / 112)),
    );
    assert.ok(chart.areaPath);
  }
});
test("an empty series has no invented points or filled area", () => {
  const chart = createChartLayout([], "moisture", 640, 300);
  assert.deepEqual(chart.points, []);
  assert.deepEqual(chart.labelIndexes, []);
  assert.equal(chart.linePath, "");
  assert.equal(chart.areaPath, null);
});
