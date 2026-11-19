"use client";
import { Icon } from "@/components/ui/icon";
import styles from "@/features/analytics/analytics.module.css";
import { useEffect, useId, useRef, useState } from "react";
import { createChartLayout } from "../lib/chart-layout";

import type { Reading } from "../types";
export function SensorChart({
  readings,
  metric,
}: {
  readings: Reading[];
  metric: "moisture" | "water";
}) {
  const [point, setPoint] = useState<number | null>(null);
  const gradientId = useId();
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 300 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const unit = metric === "moisture" ? "%" : "cm";
  const chart = createChartLayout(readings, metric, size.width, size.height);
  const selectedIndex = point ?? readings.length - 1;
  const selected = readings[selectedIndex];
  return (
    <>
      <div className={styles["chart-wrap"]} ref={container}>
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          role="img"
          aria-label={`Grafik pembacaan ${metric === "moisture" ? "kelembapan tanah" : "ketinggian air"}. ${readings.map((reading) => `${reading.time}: ${reading[metric]}${unit}`).join(", ")}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8dc9f" stopOpacity=".55" />
              <stop offset="100%" stopColor="#b8dc9f" stopOpacity=".03" />
            </linearGradient>
          </defs>
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={chart.left}
                x2={chart.right}
                y1={tick.y}
                y2={tick.y}
                stroke="var(--line)"
                strokeDasharray="4 5"
              />
              <text x={chart.left - 12} y={tick.y + 4} textAnchor="end">
                {tick.value}
                {metric === "moisture" ? "%" : ""}
              </text>
            </g>
          ))}
          {chart.areaPath && (
            <path
              data-testid="chart-area"
              d={chart.areaPath}
              fill={`url(#${gradientId})`}
            />
          )}
          <path
            d={chart.linePath}
            fill="none"
            stroke="#075b36"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {chart.points.map((position, index) => (
            <circle
              data-testid="chart-point"
              key={index}
              cx={position.x}
              cy={position.y}
              r={selectedIndex === index ? 5 : 3.5}
              fill={selectedIndex === index ? "#075b36" : "#fff"}
              stroke="#075b36"
              strokeWidth="2"
            />
          ))}
          {chart.labelIndexes.map((index) => (
            <text
              key={index}
              x={chart.points[index].x}
              y={chart.bottom + 24}
              textAnchor="middle"
            >
              {readings[index].time.split(", ").map((part, line) => (
                <tspan key={line} x={chart.points[index].x} dy={line ? 16 : 0}>
                  {part}
                </tspan>
              ))}
            </text>
          ))}
        </svg>
      </div>
      <div className={styles["chart-inspector"]}>
        <div className={styles["chart-value"]}>
          <Icon name="clock" size={16} />
          <span>
            {selected?.time}{" "}
            <strong>
              {selected?.[metric]}
              {unit}
            </strong>
          </span>
        </div>
        <label>
          <span>Pilih pembacaan</span>
          <select
            aria-label="Pilih titik grafik"
            value={point ?? readings.length - 1}
            onChange={(event) => setPoint(Number(event.target.value))}
          >
            {readings.map((reading, index) => (
              <option key={index} value={index}>
                {reading.time}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
