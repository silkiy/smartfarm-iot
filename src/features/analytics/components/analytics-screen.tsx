"use client";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { requestJson } from "@/lib/api-client";
import { downloadTextFile } from "@/lib/download-file";
import { PageHeading } from "@/components/ui/page-heading";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FarmSelect } from "@/features/farms/components/farm-select";
import { SensorChart } from "./sensor-chart";
import { createReportCsv } from "../lib/report-csv";
import type { ReportData } from "@/domain/report";
import { Badge } from "@/components/ui/badge";
import styles from "../analytics.module.css";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
export function Analytics() {
  const { farm, farmId, zones, notify } = useWorkspace();
  const [from, setFrom] = useState(today),
    [to, setTo] = useState(today),
    [zoneId, setZoneId] = useState("");
  const [metric, setMetric] = useState<"moisture" | "water">("moisture");
  const [result, setResult] = useState<{
      key: string;
      data: ReportData;
    } | null>(null),
    [error, setError] = useState("");
  const currentZones = zones.filter((z) => z.farmId === farmId),
    selectedZone = currentZones.find((z) => z.id === zoneId);
  const query = new URLSearchParams({
    farmId,
    from,
    to,
    ...(selectedZone ? { zoneId: selectedZone.id } : {}),
  }).toString();
  const invalid =
    !from ||
    !to ||
    from > to ||
    Date.parse(to) - Date.parse(from) > 30 * 86_400_000;
  useEffect(() => {
    if (!farmId || invalid) return;
    const controller = new AbortController();
    requestJson<ReportData>(
      `/api/reports?${query}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((data) => {
        setResult({ key: query, data });
        setError("");
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [farmId, invalid, query]);
  const data = result?.key === query ? result.data : null;
  const readings = data?.readings ?? [];
  function exportCsv() {
    downloadTextFile(
      createReportCsv({
        farmName: farm?.name,
        zoneName: selectedZone?.name,
        readings,
      }),
      `smartfarm-${from}-${to}.csv`,
      "text/csv;charset=utf-8;",
    );
    notify("Laporan data tersimpan berhasil diunduh.");
  }
  const step = Math.max(1, Math.ceil(readings.length / 24));
  const chartReadings = readings
    .filter((_, i) => i % step === 0 || i === readings.length - 1)
    .map((r) => ({
      ...r,
      time: new Date(r.time).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  return (
    <div className="page-stack">
      <PageHeading
        title="Grafik & laporan"
        description={
          farm?.isDemo
            ? "Data DUMMY untuk latihan, bukan hasil pengukuran atau aktivitas perangkat fisik."
            : "Pembacaan sensor dan kejadian irigasi yang tersimpan di database."
        }
      >
        <button
          className="button button-secondary"
          onClick={() => window.print()}
        >
          Cetak laporan
        </button>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        <label className="zone-select">
          <span>Zona</span>
          <select
            aria-label="Filter zona analisis"
            value={selectedZone?.id ?? ""}
            onChange={(e) => setZoneId(e.target.value)}
          >
            <option value="">Semua petak</option>
            {currentZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="panel stack">
        <h2>Filter laporan</h2>
        <div className="form-grid">
          <Field label="Dari tanggal">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field
            label="Sampai tanggal"
            hint="Maksimal 31 hari, waktu Asia/Jakarta."
          >
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
      </section>
      <section className="panel stack" aria-label="Laporan pembacaan sensor">
        {invalid ? (
          <p role="alert">
            Pilih rentang tanggal yang valid, maksimal 31 hari.
          </p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !farm ? (
          <EmptyState
            title="Belum ada lahan"
            description="Tambahkan lahan untuk membuka laporan."
          />
        ) : !data ? (
          <p role="status">Memuat laporan…</p>
        ) : !readings.length ? (
          <EmptyState
            title="Belum ada pembacaan sensor"
            description="Laporan belum memiliki data pada rentang ini. Tidak ada angka sensor buatan; pembacaan tersedia setelah integrasi perangkat."
          />
        ) : (
          <>
            <div className={styles["chart-header"]}>
              <div className={styles["chart-summary"]}>
                <h2>Riwayat pembacaan</h2>
                <p>
                  {readings.length} pembacaan · Rata-rata kelembapan{" "}
                  <strong>
                    {(
                      readings.reduce((n, r) => n + r.moisture, 0) /
                      readings.length
                    ).toFixed(1)}
                    %
                  </strong>
                </p>
              </div>
              <div className={styles["metric-control"]}>
                <Field label="Jenis pembacaan">
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as typeof metric)}
                  >
                    <option value="moisture">Kelembapan tanah (%)</option>
                    <option value="water">Ketinggian air (cm)</option>
                  </select>
                </Field>
              </div>
            </div>
            <SensorChart
              key={query + metric}
              readings={chartReadings}
              metric={metric}
            />
            <p className="muted">
              {readings.length === 1
                ? "Baru ada satu pembacaan. Tren dapat dilihat setelah tersedia lebih banyak data."
                : "Grafik menampilkan cuplikan pembacaan pada rentang terpilih."}
            </p>
          </>
        )}
        <div className={styles["report-footer"]}>
          <p>
            CSV memuat seluruh pembacaan pada rentang tanggal dan zona terpilih.
          </p>
          <button
            className="button button-primary"
            disabled={!data || invalid || Boolean(error)}
            onClick={exportCsv}
          >
            Unduh CSV
          </button>
        </div>
      </section>
      <section className="panel stack">
        <h2>Riwayat irigasi</h2>
        {data?.events.length ? (
          <ul className={styles["event-list"]}>
            {data.events.map((e) => (
              <li className={styles["event-row"]} key={e.id}>
                <div>
                  <strong>
                    {e.trigger === "MANUAL"
                      ? "Irigasi manual"
                      : "Irigasi otomatis"}
                  </strong>
                  <time dateTime={e.time}>
                    {new Date(e.time).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}{" "}
                    WIB
                  </time>
                </div>
                <div className="form-actions">
                  {e.isDemo && <Badge tone="neutral">DUMMY</Badge>}
                  <Badge tone={e.result === "SUCCESS" ? "green" : "neutral"}>
                    {e.result === "FAILED"
                      ? "Gagal"
                      : e.result === "SUCCESS"
                        ? "Selesai"
                        : e.result}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Belum ada kejadian irigasi pada rentang ini.</p>
        )}
      </section>
    </div>
  );
}
