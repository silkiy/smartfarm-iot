"use client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeading } from "@/components/ui/page-heading";
import styles from "@/features/dashboard/dashboard.module.css";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { FarmSelect } from "@/features/farms/components/farm-select";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";
import { FarmOverview } from "./farm-overview";
import { Gauge } from "./moisture-gauge";
import { ZoneCard } from "./zone-card";

export function Dashboard() {
  const { farm, farmId, zones, user, refresh: reload, notify } = useWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const currentZones = zones.filter((zone) => zone.farmId === farmId);
  const onlineZones = currentZones.filter((zone) => zone.online);
  const readingZones = currentZones.filter((zone) => zone.hasReading);
  const average = readingZones.length
    ? Math.round(
        readingZones.reduce((sum, zone) => sum + zone.moisture, 0) /
          readingZones.length,
      )
    : 0;
  const water = readingZones.length
    ? (
        readingZones.reduce((sum, zone) => sum + zone.water, 0) /
        readingZones.length
      )
        .toFixed(1)
        .replace(".", ",")
    : "—";
  const dry = readingZones.filter((zone) => zone.moisture < 40).length;
  const farmRunning = false;
  async function refresh() {
    setRefreshing(true);
    try {
      await reload();
      notify("Data lahan diperbarui.");
    } catch {
      notify("Data gagal diperbarui. Silakan coba lagi.");
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Dashboard lahan"
        description={`Selamat datang, ${user.name}. Mari lihat kondisi lahan Anda.`}
      >
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={refreshing}
        >
          <Icon name="refresh" className={refreshing ? styles["spin"] : ""} />
          {refreshing ? "Memuat…" : "Perbarui"}
        </button>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        <span className={cn("muted", styles["timestamp"])}>
          <Icon name="clock" size={15} />
          Data lahan tersimpan
        </span>
      </div>
      {!farm ? (
        <section className="panel">
          <EmptyState
            title="Mulai dari lahan pertama"
            description="Tambahkan lahan dan zona untuk melihat ringkasan kondisinya."
          >
            <Link href="/lahan" className="button button-primary">
              <Icon name="plus" />
              Tambah lahan
            </Link>
          </EmptyState>
        </section>
      ) : (
        <>
          <FarmOverview farm={farm} zoneCount={currentZones.length} />
          <div className={styles["metrics-grid"]}>
            <section className={cn("panel", styles["moisture-panel"])}>
              <div className="panel-title">
                <h2>Kelembapan tanah</h2>
                <span className="icon-tile small">
                  <Icon name="leaf" />
                </span>
              </div>
              {readingZones.length ? (
                <>
                  <Gauge value={average} />
                  <div className={styles["metric-foot"]}>
                    <Badge tone={average < 40 ? "amber" : "green"}>
                      {average < 40 ? "Perlu perhatian" : "Kondisi terpantau"}
                    </Badge>
                    <small>
                      Dari {readingZones.length} zona dengan pembacaan tersimpan
                    </small>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Belum ada data terbaru"
                  description="Sensor yang aktif akan ditampilkan di sini."
                />
              )}
            </section>
            <section className={cn("panel", styles["water-panel"])}>
              <div className="panel-title">
                <h2>Ketinggian air</h2>
                <span className="icon-tile small blue">
                  <Icon name="drop" />
                </span>
              </div>
              <div className={styles["water-visual"]}>
                <div className={styles["water-scale"]}>
                  <span>20 cm</span>
                  <span>10 cm</span>
                  <span>0 cm</span>
                </div>
                <div className={styles["water-tank"]}>
                  <div className={styles["water-fill"]} />
                  <Icon name="drop" size={28} />
                </div>
                <div className={styles["water-reading"]}>
                  <strong>
                    {readingZones.length ? water : "—"}
                    <span>cm</span>
                  </strong>
                  <p>Rata-rata pembacaan tersimpan</p>
                  <span className="muted">Skala miniatur 0–20 cm</span>
                </div>
              </div>
              <div className={styles["metric-foot"]}>
                <span className="muted">
                  <Icon name="info" size={15} />
                  Ambang mengikuti kalibrasi
                </span>
              </div>
            </section>
            <section className={cn("panel", styles["pump-panel"])}>
              <div className="panel-title">
                <h2>Status irigasi</h2>
                <span className="icon-tile small">
                  <Icon name="settings" />
                </span>
              </div>
              <div
                className={cn(
                  styles["pump-indicator"],
                  farmRunning ? styles["pump-active"] : "",
                )}
              >
                <Icon name="drop" size={32} />
              </div>
              <h3>
                {farmRunning ? "Air sedang mengalir" : "Menunggu perangkat"}
              </h3>
              <div className={styles["actuator-row"]}>
                <span>
                  Pompa <strong>Belum diketahui</strong>
                </span>
                <span>
                  Katup <strong>Belum diketahui</strong>
                </span>
              </div>
              <Link
                href="/irigasi"
                className="button button-primary full-width"
              >
                Atur irigasi <Icon name="arrow" size={17} />
              </Link>
            </section>
          </div>
          {(dry > 0 || onlineZones.length < currentZones.length) && (
            <div className={styles["attention-note"]}>
              <Icon name="alert" size={21} />
              <div>
                <strong>
                  {dry > 0
                    ? `${dry} petak memerlukan perhatian`
                    : "Perangkat belum terhubung"}
                </strong>
                <p>
                  {dry > 0
                    ? "Kelembapan di bawah ambang 40%. Periksa sensor sebelum mengairi."
                    : "Pembacaan sensor tersedia setelah perangkat dipasang dan dikalibrasi."}
                </p>
              </div>
              <Link href="/notifikasi" className="text-link">
                Lihat peringatan <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
          <div className={styles["section-title"]}>
            <div>
              <h2>Kondisi setiap petak</h2>
              <p>Dua pembacaan sensor untuk keputusan yang lebih jelas.</p>
            </div>
            <Badge tone="neutral">
              {onlineZones.length}/{currentZones.length} perangkat aktif
            </Badge>
          </div>
          <div className={styles["zones-grid"]}>
            {currentZones.map((zone, index) => (
              <ZoneCard key={zone.id} zone={zone} index={index} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
