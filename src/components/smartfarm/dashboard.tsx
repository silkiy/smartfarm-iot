"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "./demo-provider";
import { Badge, EmptyState, FarmSelect, PageHeading } from "./ui";
import { Icon } from "./icon";

function Gauge({ value }: { value: number }) {
  return (
    <div className="gauge">
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle cx="90" cy="90" r="74" className="gauge-track" />
        <circle
          cx="90"
          cy="90"
          r="74"
          className="gauge-value"
          strokeDasharray={`${value * 4.65} 465`}
        />
      </svg>
      <div className="gauge-label">
        <strong>
          {value}
          <span>%</span>
        </strong>
        <span>Kelembapan rata-rata</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { farm, farmId, zones, runningZone, notify, setSelectedZoneId } =
    useDemo();
  const [refreshing, setRefreshing] = useState(false);
  const currentZones = zones.filter((zone) => zone.farmId === farmId);
  const onlineZones = currentZones.filter((zone) => zone.online);
  const average = onlineZones.length
    ? Math.round(
        onlineZones.reduce((sum, zone) => sum + zone.moisture, 0) /
          onlineZones.length,
      )
    : 0;
  const water = onlineZones.length
    ? (
        onlineZones.reduce((sum, zone) => sum + zone.water, 0) /
        onlineZones.length
      )
        .toFixed(1)
        .replace(".", ",")
    : "—";
  const dry = onlineZones.filter((zone) => zone.moisture < 40).length;
  const farmRunning = currentZones.some((zone) => zone.id === runningZone);
  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      notify(
        "Data contoh dimuat ulang. Belum ada pembacaan perangkat langsung.",
      );
    }, 600);
  }

  return (
    <>
      <PageHeading
        title="Dashboard lahan"
        description="Selamat datang, Pak Supadi. Mari lihat kondisi sawah Anda."
      >
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={refreshing}
        >
          <Icon name="refresh" className={refreshing ? "spin" : ""} />
          {refreshing ? "Memuat…" : "Perbarui"}
        </button>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        <span className="muted timestamp">
          <Icon name="clock" size={15} />
          Data contoh · 10.45 WIB
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
          <div className="overview-grid">
            <section className="farm-hero">
              <Image
                src="/images/rice-fields.jpg"
                alt="Hamparan sawah hijau sebagai ilustrasi lahan"
                fill
                sizes="(min-width: 1100px) 55vw, 100vw"
                priority
              />
              <div className="farm-hero-shade" />
              <div className="farm-hero-content">
                <span className="photo-label">
                  <Icon name="leaf" size={15} />
                  Sawah Anda, terpantau
                </span>
                <div>
                  <p className="hero-location">
                    <Icon name="pin" size={16} />
                    {farm.location}
                  </p>
                  <h2>{farm.name}</h2>
                  <div className="hero-details">
                    <span>{farm.area} m²</span>
                    <span>{currentZones.length} zona</span>
                    <span>Fase {farm.phase.toLowerCase()}</span>
                  </div>
                </div>
                <Link href="/lahan" className="hero-link">
                  Lihat detail lahan <Icon name="arrow" size={18} />
                </Link>
              </div>
            </section>
            <section className="weather-panel">
              <div className="panel-title">
                <h2>Cuaca sekitar lahan</h2>
                <Badge tone="neutral">Contoh</Badge>
              </div>
              <div className="weather-main">
                <div>
                  <strong>
                    28<span>°C</span>
                  </strong>
                  <p>Cerah berawan</p>
                </div>
                <div className="weather-art">
                  <Icon name="sun" size={65} />
                  <Icon name="cloud" size={62} />
                </div>
              </div>
              <div className="weather-details">
                <span>
                  <Icon name="drop" size={17} />
                  Kelembapan <strong>76%</strong>
                </span>
                <span>
                  <Icon name="wind" size={17} />
                  Angin <strong>8 km/j</strong>
                </span>
              </div>
              <p className="weather-note">
                Ilustrasi cuaca untuk {farm.location}
              </p>
            </section>
          </div>
          <div className="metrics-grid">
            <section className="panel moisture-panel">
              <div className="panel-title">
                <h2>Kelembapan tanah</h2>
                <span className="icon-tile small">
                  <Icon name="leaf" />
                </span>
              </div>
              {onlineZones.length ? (
                <>
                  <Gauge value={average} />
                  <div className="metric-foot">
                    <Badge tone={average < 40 ? "amber" : "green"}>
                      {average < 40 ? "Perlu perhatian" : "Kondisi terpantau"}
                    </Badge>
                    <small>Dari {onlineZones.length} sensor aktif</small>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Belum ada data terbaru"
                  description="Sensor yang aktif akan ditampilkan di sini."
                />
              )}
            </section>
            <section className="panel water-panel">
              <div className="panel-title">
                <h2>Ketinggian air</h2>
                <span className="icon-tile small blue">
                  <Icon name="drop" />
                </span>
              </div>
              <div className="water-visual">
                <div className="water-scale">
                  <span>20 cm</span>
                  <span>10 cm</span>
                  <span>0 cm</span>
                </div>
                <div className="water-tank">
                  <div className="water-fill" />
                  <Icon name="drop" size={28} />
                </div>
                <div className="water-reading">
                  <strong>
                    {water}
                    <span>cm</span>
                  </strong>
                  <p>Rata-rata genangan</p>
                  <span className="muted">Skala miniatur 0–20 cm</span>
                </div>
              </div>
              <div className="metric-foot">
                <span className="muted">
                  <Icon name="info" size={15} />
                  Ambang mengikuti kalibrasi
                </span>
              </div>
            </section>
            <section className="panel pump-panel">
              <div className="panel-title">
                <h2>Status irigasi</h2>
                <span className="icon-tile small">
                  <Icon name="settings" />
                </span>
              </div>
              <div
                className={`pump-indicator${farmRunning ? " pump-active" : ""}`}
              >
                <Icon name="drop" size={32} />
              </div>
              <h3>
                {farmRunning
                  ? "Air sedang mengalir"
                  : "Irigasi sedang berhenti"}
              </h3>
              <div className="actuator-row">
                <span>
                  Pompa <strong>{farmRunning ? "Menyala" : "Mati"}</strong>
                </span>
                <span>
                  Katup <strong>{farmRunning ? "Terbuka" : "Tertutup"}</strong>
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
            <div className="attention-note">
              <Icon name="alert" size={21} />
              <div>
                <strong>
                  {dry > 0
                    ? `${dry} petak memerlukan perhatian`
                    : "Ada perangkat yang terputus"}
                </strong>
                <p>
                  {dry > 0
                    ? "Kelembapan di bawah ambang contoh 40%. Periksa sensor sebelum mengairi."
                    : "Sebagian pembacaan sudah lama. Periksa koneksi perangkat."}
                </p>
              </div>
              <Link href="/notifikasi" className="text-link">
                Lihat peringatan <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
          <div className="section-title">
            <div>
              <h2>Kondisi setiap petak</h2>
              <p>Dua pembacaan sensor untuk keputusan yang lebih jelas.</p>
            </div>
            <Badge tone="neutral">
              {onlineZones.length}/{currentZones.length} perangkat aktif
            </Badge>
          </div>
          <div className="zones-grid">
            {currentZones.map((zone, index) => (
              <section
                className={`panel zone-card${!zone.online ? " zone-offline" : ""}`}
                key={zone.id}
              >
                <div className="panel-title">
                  <div className="zone-name">
                    <span className="zone-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{zone.name}</h3>
                  </div>
                  <Badge
                    tone={
                      !zone.online
                        ? "neutral"
                        : zone.moisture < 40
                          ? "amber"
                          : "green"
                    }
                  >
                    {!zone.online
                      ? "Terputus"
                      : zone.moisture < 40
                        ? "Mulai kering"
                        : "Cukup air"}
                  </Badge>
                </div>
                <div className="zone-readings">
                  <div>
                    <span>
                      <Icon name="leaf" size={15} />
                      Kelembapan
                    </span>
                    <strong>
                      {zone.hasReading === false ? "—" : zone.moisture}
                      {zone.hasReading !== false && <small>%</small>}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <Icon name="drop" size={15} />
                      Level air
                    </span>
                    <strong>
                      {zone.hasReading === false
                        ? "—"
                        : zone.water.toFixed(1).replace(".", ",")}
                      {zone.hasReading !== false && <small>cm</small>}
                    </strong>
                  </div>
                </div>
                <div className="zone-footer">
                  <span className="muted">
                    <span
                      className={`status-dot ${zone.online ? "green-dot" : "grey-dot"}`}
                    />
                    {zone.hasReading === false
                      ? "Belum ada pembacaan"
                      : zone.online
                        ? "Data contoh · 10.45 WIB"
                        : "Data lama · 10 menit lalu"}
                  </span>
                  <Link
                    href="/irigasi"
                    onClick={() => setSelectedZoneId(zone.id)}
                    aria-label={`Kontrol irigasi ${zone.name}`}
                  >
                    <Icon name="arrow" size={18} />
                  </Link>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
