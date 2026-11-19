import type { Reading } from "../types";

export function createChartLayout(
  readings: Reading[],
  metric: "moisture" | "water",
  width: number,
  height: number,
) {
  const left = 48,
    right = width - 24,
    top = 24,
    bottom = height - 60;
  const max = metric === "moisture" ? 100 : 20;
  const points = readings.map((reading, index) => ({
    x:
      readings.length === 1
        ? (left + right) / 2
        : left + index * ((right - left) / (readings.length - 1)),
    y: bottom - (reading[metric] / max) * (bottom - top),
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${right},${bottom} L${left},${bottom} Z`
      : null;
  const labelCount = Math.min(
    readings.length,
    6,
    Math.max(2, Math.floor((right - left) / 112)),
  );
  const labelIndexes = Array.from({ length: labelCount }, (_, index) =>
    labelCount === 1
      ? 0
      : Math.round((index * (readings.length - 1)) / (labelCount - 1)),
  );
  const ticks = [0, 25, 50, 75, 100].map((percent) => ({
    value: (percent / 100) * max,
    y: bottom - (percent / 100) * (bottom - top),
  }));
  return {
    left,
    right,
    bottom,
    points,
    linePath,
    areaPath,
    labelIndexes,
    ticks,
  };
}
