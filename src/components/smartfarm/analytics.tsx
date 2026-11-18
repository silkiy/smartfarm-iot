"use client";

import { useState } from "react";
import { SensorChart, type Reading } from "./sensor-chart";
import { useDemo } from "./demo-provider";
import { demoReadings } from "./demo-data";
import { Badge, EmptyState, FarmSelect, Field, PageHeading } from "./ui";
import { Icon } from "./icon";

export function Analytics() {
  const { zones, farmId, farm, notify } = useDemo();
  const [range, setRange] = useState("24j");
  const [metric, setMetric] = useState<"moisture" | "water">("moisture");
  const [zoneId, setZoneId] = useState("all");
  const [startDate, setStartDate] = useState("2026-11-12");
  const [endDate, setEndDate] = useState("2026-11-18");
  const currentZones = zones.filter((zone) => zone.farmId === farmId);
  const validZoneId = currentZones.some((zone) => zone.id === zoneId)
    ? zoneId
    : "all";
  const selectedZone = currentZones.find((zone) => zone.id === validZoneId);
  const badDate =
    range === "custom" && (!startDate || !endDate || endDate < startDate);
  const days =
    range === "7h"
      ? 7
      : range === "30h"
        ? 30
        : range === "custom" && !badDate
          ? Math.min(
              31,
              Math.floor(
                (Date.parse(endDate) - Date.parse(startDate)) / 86400000,
              ) + 1,
            )
          : 1;
  const offset = selectedZone
    ? Math.round((selectedZone.moisture - 60) / 3)
    : farmId === "farm-b"
      ? 4
      : 0;
  const readings: Reading[] =
    range === "24j"
      ? demoReadings.map((reading) => ({
          ...reading,
          moisture: Math.max(0, Math.min(100, reading.moisture + offset)),
          water: Number(Math.max(0, reading.water + offset / 10).toFixed(1)),
        }))
      : Array.from({ length: days }, (_, index) => {
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
            water: Number(
              (4.2 + ((index * 3) % 26) / 10 + offset / 10).toFixed(1),
            ),
          };
        });
  const average =
    readings.reduce((sum, reading) => sum + reading.moisture, 0) /
    Math.max(1, readings.length);
  function exportCsv() {
    const csv =
      "\uFEFFJenis data,Lahan,Zona,Waktu,Kelembapan (%),Ketinggian air (cm)\r\n" +
      readings
        .map((reading) =>
          [
            "CONTOH",
            farm?.name,
            selectedZone?.name ?? "Semua petak",
            reading.time,
            reading.moisture,
            reading.water,
          ]
            .map((value) => {
              const text = String(value ?? "");
              const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
              return `"${safe.replaceAll('"', '""')}"`;
            })
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartfarm-data-contoh-${range}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Laporan CSV data contoh berhasil diunduh.");
  }
  return (
    <>
      <PageHeading
        title="Grafik & laporan"
        description="Kenali pola kelembapan dan ketinggian air dari waktu ke waktu."
      >
        <button
          className="button button-secondary"
          onClick={() => window.print()}
        >
          <Icon name="print" size={17} />
          Cetak laporan
        </button>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        <label className="zone-select">
          <span>Zona</span>
          <select
            aria-label="Filter zona analisis"
            value={validZoneId}
            onChange={(event) => setZoneId(event.target.value)}
          >
            <option value="all">Semua petak</option>
            {currentZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {currentZones.length === 0 ||
      selectedZone?.hasReading === false ||
      !currentZones.some((zone) => zone.hasReading !== false) ? (
        <section className="panel">
          <EmptyState
            title="Belum ada riwayat petak"
            description="Tambahkan zona pada lahan untuk meninjau contoh grafik dan laporan."
          />
        </section>
      ) : (
        <>
          <div className="analytics-summary">
            <section className="panel summary-metric">
              <span className="icon-tile">
                <Icon name="leaf" />
              </span>
              <div>
                <p>Rata-rata kelembapan</p>
                <strong>
                  {average.toFixed(1).replace(".", ",")}
                  <small>%</small>
                </strong>
                <span>Ringkasan data contoh</span>
              </div>
            </section>
            <section className="panel summary-metric">
              <span className="icon-tile blue">
                <Icon name="drop" />
              </span>
              <div>
                <p>Rata-rata ketinggian air</p>
                <strong>
                  {(
                    readings.reduce((sum, reading) => sum + reading.water, 0) /
                    readings.length
                  )
                    .toFixed(1)
                    .replace(".", ",")}
                  <small>cm</small>
                </strong>
                <span>Skala miniatur sawah</span>
              </div>
            </section>
            <section className="panel summary-metric">
              <span className="icon-tile">
                <Icon name="chart" />
              </span>
              <div>
                <p>Pembacaan pada grafik</p>
                <strong>
                  {readings.length}
                  <small>titik</small>
                </strong>
                <span>
                  {range === "24j"
                    ? "Cuplikan dalam 24 jam"
                    : `Cuplikan ${days} hari`}
                </span>
              </div>
            </section>
          </div>
          <section className="panel analytics-chart">
            <div className="panel-title">
              <div>
                <h2>Tren kondisi lahan</h2>
                <p>
                  {farm?.name} · {selectedZone?.name ?? "Semua petak"}
                </p>
              </div>
              <Badge tone="neutral">Data contoh</Badge>
            </div>
            <div className="chart-toolbar">
              <div className="segmented" aria-label="Rentang waktu">
                {[
                  ["24j", "24 jam"],
                  ["7h", "7 hari"],
                  ["30h", "30 hari"],
                  ["custom", "Kustom"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={range === value ? "selected" : ""}
                    aria-pressed={range === value}
                    onClick={() => setRange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="metric-select">
                <span className="sr-only">Jenis pembacaan</span>
                <select
                  aria-label="Jenis pembacaan"
                  value={metric}
                  onChange={(event) =>
                    setMetric(event.target.value as "moisture" | "water")
                  }
                >
                  <option value="moisture">Kelembapan tanah (%)</option>
                  <option value="water">Ketinggian air (cm)</option>
                </select>
              </label>
            </div>
            {range === "custom" && (
              <div className="custom-date-fields">
                <Field label="Dari tanggal">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </Field>
                <Field
                  label="Sampai tanggal"
                  hint="Maksimal 31 hari cuplikan contoh."
                >
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </Field>
              </div>
            )}
            {badDate ? (
              <div className="info-banner" role="alert">
                <Icon name="alert" />
                <p>
                  Pilih rentang tanggal yang valid. Tanggal akhir harus sama
                  atau setelah tanggal awal.
                </p>
              </div>
            ) : (
              <SensorChart
                key={`${range}-${metric}-${validZoneId}-${farmId}-${startDate}-${endDate}`}
                readings={readings}
                metric={metric}
              />
            )}
          </section>
          <div className="analytics-bottom">
            <section className="panel">
              <div className="panel-title">
                <h2>Contoh aktivitas irigasi</h2>
                <Badge tone="neutral">3 aktivitas</Badge>
              </div>
              <div className="activity-list">
                {[
                  {
                    title: "Irigasi manual selesai",
                    time: "09.42 WIB",
                    description: "Petak Barat · 10 detik",
                    icon: "check" as const,
                  },
                  {
                    title: "Aturan sensor dievaluasi",
                    time: "08.15 WIB",
                    description: "Petak Timur · kelembapan 38%",
                    icon: "sensor" as const,
                  },
                  {
                    title: "Pengaman durasi aktif",
                    time: "Kemarin",
                    description: "Pompa berhenti pada batas 15 detik",
                    icon: "shield" as const,
                  },
                ].map((event) => (
                  <div className="activity-item" key={event.title}>
                    <span className="activity-icon">
                      <Icon name={event.icon} size={16} />
                    </span>
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                    </div>
                    <time>{event.time}</time>
                  </div>
                ))}
              </div>
            </section>
            <section className="export-panel">
              <span className="icon-tile">
                <Icon name="download" size={25} />
              </span>
              <h2>Simpan ringkasan lahan</h2>
              <p>
                Unduh data yang sedang ditampilkan untuk ditinjau kembali. Semua
                isinya merupakan data contoh.
              </p>
              <button
                className="button button-primary full-width"
                onClick={exportCsv}
                disabled={badDate}
              >
                <Icon name="download" size={17} />
                Unduh CSV
              </button>
              <p className="export-note">
                Untuk PDF, pilih “Cetak laporan”, lalu simpan sebagai PDF
                melalui browser.
              </p>
            </section>
          </div>
          <p className="print-note">
            Laporan pratinjau SmartFarm IoT. Seluruh angka merupakan data contoh
            dan bukan hasil pengukuran fisik.
          </p>
        </>
      )}
    </>
  );
}
