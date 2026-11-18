"use client";

import Image from "next/image";
import { useState } from "react";
import { useDemo } from "@/features/demo/demo-provider";
import type { Farm, Zone } from "@/features/demo/types";
import { FarmForm, ZoneForm } from "@/features/farms/components/farm-forms";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Icon } from "@/components/ui/icon";

type Editor =
  | { type: "farm"; farm?: Farm }
  | { type: "zone"; farmId: string; zone?: Zone }
  | { type: "delete-farm"; farm: Farm }
  | { type: "delete-zone"; zone: Zone }
  | { type: "device"; zone: Zone }
  | null;

export function Farms() {
  const {
    farms,
    setFarms,
    zones,
    setZones,
    farmId,
    setFarmId,
    role,
    runningZone,
    stopIrrigation,
    notify,
  } = useDemo();
  const [editor, setEditor] = useState<Editor>(null);
  const [search, setSearch] = useState("");
  const readonly = role === "Pekerja lapangan";
  const filtered = farms.filter((farm) =>
    `${farm.name} ${farm.location}`
      .toLocaleLowerCase("id-ID")
      .includes(search.toLocaleLowerCase("id-ID")),
  );
  function deleteFarm(farm: Farm) {
    if (
      zones.some((zone) => zone.farmId === farm.id && zone.id === runningZone)
    )
      stopIrrigation();
    setFarms((previous) => previous.filter((item) => item.id !== farm.id));
    setZones((previous) => previous.filter((zone) => zone.farmId !== farm.id));
    if (farmId === farm.id)
      setFarmId(farms.find((item) => item.id !== farm.id)?.id ?? "");
    setEditor(null);
    notify("Lahan dan zona terkait dihapus dari sesi demo.");
  }
  function deleteZone(zone: Zone) {
    if (runningZone === zone.id) stopIrrigation();
    setZones((previous) => previous.filter((item) => item.id !== zone.id));
    setEditor(null);
    notify("Zona dihapus dari sesi demo.");
  }
  return (
    <>
      <PageHeading
        title="Lahan & sensor"
        description="Kelola lahan, petak, dan perangkat dari satu tempat."
      >
        {!readonly && (
          <button
            className="button button-primary"
            onClick={() => setEditor({ type: "farm" })}
          >
            <Icon name="plus" size={17} />
            Tambah lahan
          </button>
        )}
      </PageHeading>
      <div className="farm-summary-row">
        <div>
          <span className="icon-tile small">
            <Icon name="farm" />
          </span>
          <strong>{farms.length}</strong>
          <span>lahan terdaftar</span>
        </div>
        <div>
          <span className="icon-tile small">
            <Icon name="dashboard" />
          </span>
          <strong>{zones.length}</strong>
          <span>zona pemantauan</span>
        </div>
        <div>
          <span className="icon-tile small">
            <Icon name="sensor" />
          </span>
          <strong>
            {zones.filter((zone) => zone.online).length}/{zones.length}
          </strong>
          <span>perangkat contoh aktif</span>
        </div>
      </div>
      <div className="section-toolbar">
        <label className="search-field">
          <Icon name="farm" size={18} />
          <input
            type="search"
            aria-label="Cari lahan"
            placeholder="Cari nama atau lokasi lahan…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Badge tone="neutral">
          {readonly ? "Akses pemantauan" : "Pengelolaan lahan"}
        </Badge>
      </div>
      {filtered.length === 0 ? (
        <section className="panel">
          <EmptyState
            title={
              farms.length === 0
                ? "Lahan pertama Anda dimulai di sini"
                : "Lahan tidak ditemukan"
            }
            description={
              farms.length === 0
                ? "Tambahkan lahan, lalu buat zona untuk mengatur pemantauan sawah."
                : "Coba nama atau lokasi lain untuk menemukan lahan."
            }
          >
            {farms.length === 0 && !readonly ? (
              <button
                className="button button-primary"
                onClick={() => setEditor({ type: "farm" })}
              >
                <Icon name="plus" />
                Tambah lahan
              </button>
            ) : search ? (
              <button
                className="button button-secondary"
                onClick={() => setSearch("")}
              >
                Hapus pencarian
              </button>
            ) : null}
          </EmptyState>
        </section>
      ) : (
        <div className="farm-cards">
          {filtered.map((farm, farmIndex) => {
            const farmZones = zones.filter((zone) => zone.farmId === farm.id);
            return (
              <section className="farm-card" key={farm.id}>
                <div className="farm-card-photo">
                  <Image
                    src={
                      farmIndex % 2 === 0
                        ? "/images/rice-fields.jpg"
                        : "/images/rice-detail.jpg"
                    }
                    alt="Ilustrasi persawahan"
                    fill
                    sizes="(min-width: 1100px) 45vw, 100vw"
                  />
                  <div className="farm-card-shade" />
                  <div className="farm-photo-top">
                    <span className="photo-label">
                      <Icon name="leaf" size={14} />
                      {farm.phase}
                    </span>
                    {!readonly && (
                      <div className="photo-actions">
                        <button
                          className="icon-button"
                          aria-label={`Ubah ${farm.name}`}
                          onClick={() => setEditor({ type: "farm", farm })}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Hapus ${farm.name}`}
                          onClick={() =>
                            setEditor({ type: "delete-farm", farm })
                          }
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="farm-photo-title">
                    <p>
                      <Icon name="pin" size={14} />
                      {farm.location}
                    </p>
                    <h2>{farm.name}</h2>
                    <span>
                      {farm.area} m² · {farmZones.length} zona
                    </span>
                  </div>
                </div>
                <div className="farm-card-body">
                  <div className="panel-title">
                    <h3>Zona pemantauan</h3>
                    {!readonly && (
                      <button
                        className="text-link"
                        onClick={() =>
                          setEditor({ type: "zone", farmId: farm.id })
                        }
                      >
                        <Icon name="plus" size={15} />
                        Tambah zona
                      </button>
                    )}
                  </div>
                  {farmZones.length === 0 ? (
                    <div className="zone-empty">
                      <Icon name="sensor" size={25} />
                      <p>
                        Belum ada zona. Tambahkan petak untuk mulai mengatur
                        lahan.
                      </p>
                    </div>
                  ) : (
                    <div className="farm-zone-list">
                      {farmZones.map((zone, index) => (
                        <div className="farm-zone-row" key={zone.id}>
                          <span className="zone-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3>{zone.name}</h3>
                            <p>
                              {zone.online
                                ? `${zone.moisture}% kelembapan · ${zone.water.toFixed(1).replace(".", ",")} cm air`
                                : "Tidak ada pembacaan terbaru"}
                            </p>
                            <span
                              className={`device-state ${zone.online ? "online-state" : "offline-state"}`}
                            >
                              <span className="status-dot" />
                              {zone.online
                                ? "Perangkat contoh aktif"
                                : "Terputus / belum terhubung"}
                            </span>
                          </div>
                          <div className="zone-row-actions">
                            <button
                              className="icon-button"
                              aria-label={`Lihat perangkat ${zone.name}`}
                              onClick={() =>
                                setEditor({ type: "device", zone })
                              }
                            >
                              <Icon name="sensor" size={16} />
                            </button>
                            {!readonly && (
                              <>
                                <button
                                  className="icon-button"
                                  aria-label={`Ubah ${zone.name}`}
                                  onClick={() =>
                                    setEditor({
                                      type: "zone",
                                      farmId: farm.id,
                                      zone,
                                    })
                                  }
                                >
                                  <Icon name="edit" size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Hapus ${zone.name}`}
                                  onClick={() =>
                                    setEditor({ type: "delete-zone", zone })
                                  }
                                >
                                  <Icon name="trash" size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="farm-card-footer">
                    <span className="muted">
                      <Icon name="shield" size={14} />
                      {readonly ? "Pemantauan zona" : "Lahan Pak Supadi"}
                    </span>
                    <button
                      className="text-link"
                      onClick={() => {
                        setFarmId(farm.id);
                        notify(
                          `${farm.name} dipilih untuk dashboard dan irigasi.`,
                        );
                      }}
                    >
                      {farmId === farm.id ? "Lahan terpilih" : "Pilih lahan"}
                      <Icon
                        name={farmId === farm.id ? "check" : "arrow"}
                        size={16}
                      />
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <div className="quiet-note farm-bottom-note">
        <Icon name="info" size={20} />
        <p>
          Setiap zona dirancang untuk sensor kelembapan tanah dan ketinggian
          air. Identitas perangkat dan kalibrasi fisik dilengkapi pada tahap
          integrasi IoT.
        </p>
      </div>
      {editor?.type === "farm" && (
        <FarmForm farm={editor.farm} onClose={() => setEditor(null)} />
      )}
      {editor?.type === "zone" && (
        <ZoneForm
          farmId={editor.farmId}
          zone={editor.zone}
          onClose={() => setEditor(null)}
        />
      )}
      {editor?.type === "delete-farm" && (
        <Dialog title="Hapus lahan dari demo?" onClose={() => setEditor(null)}>
          <p>
            <strong>{editor.farm.name}</strong> beserta zona terkait akan
            dihapus dari sesi demo ini. Data contoh awal dapat dipulihkan dengan
            memuat ulang halaman.
          </p>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => setEditor(null)}
            >
              Batal
            </button>
            <button
              className="button button-danger"
              onClick={() => deleteFarm(editor.farm)}
            >
              Hapus lahan
            </button>
          </div>
        </Dialog>
      )}
      {editor?.type === "delete-zone" && (
        <Dialog title="Hapus zona dari demo?" onClose={() => setEditor(null)}>
          <p>
            <strong>{editor.zone.name}</strong> akan dihapus dari sesi ini.
            Simulasi irigasi pada zona tersebut juga akan dihentikan.
          </p>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => setEditor(null)}
            >
              Batal
            </button>
            <button
              className="button button-danger"
              onClick={() => deleteZone(editor.zone)}
            >
              Hapus zona
            </button>
          </div>
        </Dialog>
      )}
      {editor?.type === "device" && (
        <Dialog
          title={`Perangkat ${editor.zone.name}`}
          onClose={() => setEditor(null)}
        >
          <Badge tone={editor.zone.online ? "green" : "neutral"}>
            {editor.zone.online
              ? "Contoh perangkat aktif"
              : "Terputus / belum terhubung"}
          </Badge>
          <div className="dialog-summary">
            <div>
              <span>Pengendali</span>
              <strong>ESP32 (contoh)</strong>
            </div>
            <div>
              <span>Sensor tanah</span>
              <strong>Kelembapan (%)</strong>
            </div>
            <div>
              <span>Sensor air</span>
              <strong>Ketinggian (cm)</strong>
            </div>
            <div>
              <span>Aktuator</span>
              <strong>Pompa & katup</strong>
            </div>
          </div>
          <p>
            Rincian ini merupakan ilustrasi kebutuhan perangkat. Pendaftaran
            perangkat dan kalibrasi belum terhubung ke layanan IoT.
          </p>
          <button
            className="button button-primary full-width"
            onClick={() => setEditor(null)}
          >
            Tutup rincian
          </button>
        </Dialog>
      )}
    </>
  );
}
