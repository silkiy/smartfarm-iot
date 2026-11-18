"use client";
import { Icon } from "@/components/ui/icon";
import styles from "@/features/analytics/analytics.module.css";
import { useId, useState } from "react";

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
  const max = metric === "moisture" ? 100 : 20;
  const unit = metric === "moisture" ? "%" : "cm";
  const positions = readings.map((reading, index) => ({
    x: 48 + index * (558 / Math.max(1, readings.length - 1)),
    y: 206 - (reading[metric] / max) * 174,
  }));
  const line = positions
    .map(
      (position, index) =>
        `${index === 0 ? "M" : "L"}${position.x},${position.y}`,
    )
    .join(" ");
  const selected =
    point !== null ? readings[point] : readings[readings.length - 1];
  return (
    <>
      <div className={styles["chart-wrap"]}>
        <svg
          viewBox="0 0 640 250"
          role="img"
          aria-label={`Grafik pembacaan ${metric === "moisture" ? "kelembapan tanah" : "ketinggian air"}. ${readings.map((reading) => `${reading.time}: ${reading[metric]}${unit}`).join(", ")}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8dc9f" stopOpacity=".55" />
              <stop offset="100%" stopColor="#b8dc9f" stopOpacity=".03" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1="48"
                x2="606"
                y1={206 - value * 1.74}
                y2={206 - value * 1.74}
                stroke="#e6ebe1"
                strokeDasharray="4 5"
              />
              <text x="35" y={210 - value * 1.74} textAnchor="end">
                {(value / 100) * max}
                {metric === "moisture" ? "%" : ""}
              </text>
            </g>
          ))}
          <path d={`${line} L606,206 L48,206 Z`} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="#075b36"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {positions.map((position, index) => (
            <circle
              key={index}
              cx={position.x}
              cy={position.y}
              r={point === index ? 6 : 3.5}
              fill={point === index ? "#075b36" : "#fff"}
              stroke="#075b36"
              strokeWidth="2"
            />
          ))}
          {readings
            .filter(
              (_, index) =>
                index % Math.max(1, Math.ceil(readings.length / 6)) === 0 ||
                index === readings.length - 1,
            )
            .map((reading) => {
              const index = readings.indexOf(reading);
              return (
                <text
                  key={index}
                  x={positions[index].x}
                  y="237"
                  textAnchor="middle"
                >
                  {reading.time}
                </text>
              );
            })}
        </svg>
      </div>
      <div className={styles["chart-inspector"]}>
        <Icon name="clock" size={16} />
        <span>
          {selected?.time}{" "}
          <strong>
            {selected?.[metric]}
            {unit}
          </strong>
        </span>
        <label>
          <span className="sr-only">Pilih titik grafik</span>
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
