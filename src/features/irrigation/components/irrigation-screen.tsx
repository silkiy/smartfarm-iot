"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/features/demo/demo-provider";
import { RuleForm } from "@/features/irrigation/components/irrigation-rule-form";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FarmSelect } from "@/features/farms/components/farm-select";
import { PageHeading } from "@/components/ui/page-heading";
import { Icon } from "@/components/ui/icon";

export function Irrigation() {
  const {
    zones,
    farmId,
    role,
    selectedZoneId,
    setSelectedZoneId,
    runningZone,
    remaining,
    startIrrigation,
    stopIrrigation,
  } = useDemo();
  const [mode, setMode] = useState("manual");
  const [duration, setDuration] = useState(10);
  const [confirm, setConfirm] = useState(false);
  const currentZones = zones.filter((zone) => zone.farmId === farmId);
  const zone =
    currentZones.find((item) => item.id === selectedZoneId) ?? currentZones[0];
  const running = runningZone === zone?.id;
  const readonly = role === "Pekerja lapangan";
  return (
    <>
      <PageHeading
        title="Kontrol irigasi"
        description="Atur aliran air sesuai kondisi dan kebutuhan petak sawah."
      >
        <Badge tone={runningZone ? "green" : "neutral"}>
          {runningZone ? "Simulasi berjalan" : "Pompa berhenti"}
        </Badge>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        {zone && (
          <label className="zone-select">
            <span>Zona</span>
            <select
              aria-label="Pilih zona irigasi"
              value={zone.id}
              onChange={(event) => setSelectedZoneId(event.target.value)}
            >
              {currentZones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!zone ? (
        <section className="panel">
          <EmptyState
            title="Belum ada zona irigasi"
            description="Tambahkan zona dan perangkat pada lahan terlebih dahulu."
          >
            <Link href="/lahan" className="button button-primary">
              Kelola lahan
            </Link>
          </EmptyState>
        </section>
      ) : (
        <>
          {readonly && (
            <div className="info-banner">
              <Icon name="lock" size={18} />
              <p>
                Pratinjau pekerja lapangan: hanya pemantauan. Izin kontrol belum
                diberikan.
              </p>
            </div>
          )}
          <div className="irrigation-layout">
            <div>
              <div
                className="segmented mode-switch"
                aria-label="Mode pengaturan"
              >
                <button
                  className={mode === "manual" ? "selected" : ""}
                  aria-pressed={mode === "manual"}
                  onClick={() => setMode("manual")}
                >
                  <Icon name="settings" size={18} />
                  Kontrol manual
                </button>
                <button
                  className={mode === "automatic" ? "selected" : ""}
                  aria-pressed={mode === "automatic"}
                  onClick={() => setMode("automatic")}
                >
                  <Icon name="calendar" size={18} />
                  Aturan otomatis
                </button>
              </div>
              {mode === "manual" ? (
                <section
                  className={`panel irrigation-control${running ? " irrigation-running" : ""}`}
                >
                  <div className="panel-title">
                    <h2>{zone.name}</h2>
                    <Badge tone={zone.online ? "green" : "neutral"}>
                      {zone.online
                        ? "Perangkat contoh aktif"
                        : "Perangkat terputus"}
                    </Badge>
                  </div>
                  <div className="large-pump-icon">
                    <Icon name="drop" size={46} />
                  </div>
                  <h2>
                    {running
                      ? "Air sedang mengalir"
                      : "Aliran air sedang berhenti"}
                  </h2>
                  <p>
                    {running
                      ? "Hitung mundur simulasi. Pompa akan berhenti otomatis."
                      : "Mulai irigasi saat petak membutuhkan tambahan air."}
                  </p>
                  <div className="control-status">
                    <div>
                      <span>Pompa</span>
                      <strong>
                        <span
                          className={`status-dot ${running ? "green-dot" : "grey-dot"}`}
                        />
                        {running ? "Menyala" : "Mati"}
                      </strong>
                    </div>
                    <div>
                      <span>Katup</span>
                      <strong>{running ? "Terbuka" : "Tertutup"}</strong>
                    </div>
                    <div>
                      <span>{running ? "Sisa waktu" : "Durasi"}</span>
                      <strong className="timer-number">
                        {running ? remaining : duration}
                        <small>detik</small>
                      </strong>
                    </div>
                  </div>
                  <div className="duration-options">
                    <span>Durasi simulasi</span>
                    <div>
                      {[5, 10, 15].map((seconds) => (
                        <button
                          key={seconds}
                          className={duration === seconds ? "selected" : ""}
                          aria-pressed={duration === seconds}
                          onClick={() => setDuration(seconds)}
                          disabled={running || readonly}
                        >
                          {seconds}
                          <span>detik</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {running ? (
                    <button
                      className="button button-danger full-width"
                      onClick={stopIrrigation}
                      disabled={readonly}
                    >
                      <Icon name="stop" size={18} />
                      Hentikan simulasi
                    </button>
                  ) : (
                    <button
                      className="button button-primary full-width"
                      disabled={
                        readonly || !zone.online || Boolean(runningZone)
                      }
                      onClick={() => setConfirm(true)}
                    >
                      <Icon name="play" size={18} />
                      Mulai simulasi irigasi
                    </button>
                  )}
                  {!zone.online && (
                    <p className="control-helper">
                      Kontrol dinonaktifkan karena data perangkat sudah lama.
                    </p>
                  )}
                  {runningZone && !running && (
                    <p className="control-helper">
                      Simulasi sedang berjalan di zona lain. Hentikan terlebih
                      dahulu.
                    </p>
                  )}
                </section>
              ) : (
                <RuleForm key={zone.id} zoneId={zone.id} />
              )}
            </div>
            <aside className="irrigation-aside">
              <section className="panel">
                <div className="panel-title">
                  <h2>Kondisi petak</h2>
                  <Icon name="sensor" />
                </div>
                <div className="condition-stat">
                  <span>
                    <Icon name="leaf" />
                    Kelembapan tanah
                  </span>
                  <strong>
                    {zone.moisture}
                    <small>%</small>
                  </strong>
                </div>
                <div className="condition-stat">
                  <span>
                    <Icon name="drop" />
                    Ketinggian air
                  </span>
                  <strong>
                    {zone.water.toFixed(1).replace(".", ",")}
                    <small>cm</small>
                  </strong>
                </div>
                <p className="muted">
                  {zone.online
                    ? "Pembacaan contoh · 10.45 WIB"
                    : "Data lama · 10 menit lalu"}
                </p>
              </section>
              <section className="safety-panel">
                <span className="icon-tile">
                  <Icon name="shield" size={24} />
                </span>
                <h2>Pengaman tetap utama</h2>
                <ul>
                  <li>Batas simulasi maksimal 15 detik.</li>
                  <li>Katup terbuka sebelum pompa menyala.</li>
                  <li>Pompa berhenti sebelum katup menutup.</li>
                  <li>Data tidak valid menghentikan irigasi.</li>
                </ul>
                <p>
                  Perangkat fisik tetap membutuhkan pengaman lokal saat jaringan
                  terputus.
                </p>
              </section>
              <button
                className="button button-danger full-width"
                onClick={stopIrrigation}
                disabled={readonly || !runningZone}
              >
                <Icon name="stop" size={18} />
                Hentikan semua simulasi
              </button>
            </aside>
          </div>
        </>
      )}
      {confirm && zone && (
        <Dialog
          title="Mulai simulasi irigasi?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Pompa dan katup pada tampilan akan disimulasikan. Tidak ada perintah
            yang dikirim ke perangkat fisik.
          </p>
          <div className="dialog-summary">
            <div>
              <span>Zona</span>
              <strong>{zone.name}</strong>
            </div>
            <div>
              <span>Durasi</span>
              <strong>{duration} detik</strong>
            </div>
            <div>
              <span>Berhenti otomatis</span>
              <strong>Aktif</strong>
            </div>
          </div>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => setConfirm(false)}
            >
              Batal
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                startIrrigation(zone.id, duration);
                setConfirm(false);
              }}
            >
              <Icon name="play" size={16} />
              Mulai simulasi
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
