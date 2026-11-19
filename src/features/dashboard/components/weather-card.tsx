"use client";
import { requestJson } from "@/lib/api-client";
import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
export function WeatherCard({
  farmId,
  hasCoordinates,
}: {
  farmId: string;
  hasCoordinates: boolean;
}) {
  const [weather, setWeather] = useState<{
    temperatureC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    observedAt: string;
    fetchedAt: string;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasCoordinates) return;
    const controller = new AbortController();
    requestJson<NonNullable<typeof weather>>(
      `/api/farms/${farmId}/weather`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((data) => {
        setWeather(data);
        setError("");
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [farmId, hasCoordinates]);
  return (
    <section className={cn("panel form-stack", styles["weather-panel"])}>
      <h2>Cuaca lahan</h2>
      {!hasCoordinates ? (
        <p>Isi lintang dan bujur pada informasi lahan untuk melihat cuaca.</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : !weather ? (
        <p role="status">Memuat cuaca…</p>
      ) : (
        <>
          <p className={styles["weather-temperature"]}>
            <strong>{weather.temperatureC} °C</strong>
          </p>
          <p className={styles["weather-details"]}>
            Kelembapan {weather.humidityPercent}% · Angin {weather.windSpeedKmh}{" "}
            km/j
          </p>
          <p>
            Waktu cuaca:{" "}
            {new Date(weather.observedAt).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}
          </p>
          <small>
            Diperbarui{" "}
            {new Date(weather.fetchedAt).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            · Data model cuaca dari{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
          </small>
          <p className="muted">
            <Icon name="info" size={16} /> Cuaca wilayah dari model Open-Meteo,
            bukan pembacaan sensor lahan.
          </p>
        </>
      )}
    </section>
  );
}
