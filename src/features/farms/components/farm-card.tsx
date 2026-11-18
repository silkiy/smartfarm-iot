"use client";
import { Icon } from "@/components/ui/icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import type { Farm } from "@/features/workspace/types";
import { cn } from "@/lib/cn";
import Image from "next/image";
import styles from "../farms.module.css";
import type { FarmEditor } from "../types";

export function FarmCard({
  farm,
  farmIndex,
  setEditor,
}: {
  farm: Farm;
  farmIndex: number;
  setEditor: (editor: FarmEditor) => void;
}) {
  const { zones, role, farmId, setFarmId, notify } = useWorkspace();
  const readonly = role === "Pekerja lapangan";
  const farmZones = zones.filter((zone) => zone.farmId === farm.id);
  return (
    <section
      data-testid="farm-card"
      className={styles["farm-card"]}
      key={farm.id}
    >
      <div className={styles["farm-card-photo"]}>
        <Image
          src={
            farmIndex % 2 === 0
              ? "/images/rice-fields.jpg"
              : "/images/rice-detail.jpg"
          }
          alt="Ilustrasi persawahan"
          fill
          loading={farmIndex === 0 ? "eager" : "lazy"}
          sizes="(min-width: 1100px) 45vw, 100vw"
        />
        <div className={styles["farm-card-shade"]} />
        <div className={styles["farm-photo-top"]}>
          <span className="photo-label">
            <Icon name="leaf" size={14} />
            {farm.phase}
          </span>
          {!readonly && (
            <div className={styles["photo-actions"]}>
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
                onClick={() => setEditor({ type: "delete-farm", farm })}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          )}
        </div>
        <div className={styles["farm-photo-title"]}>
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
      <div className={styles["farm-card-body"]}>
        <div className="panel-title">
          <h3>Zona pemantauan</h3>
          {!readonly && (
            <button
              className="text-link"
              onClick={() => setEditor({ type: "zone", farmId: farm.id })}
            >
              <Icon name="plus" size={15} />
              Tambah zona
            </button>
          )}
        </div>
        {farmZones.length === 0 ? (
          <div className={styles["zone-empty"]}>
            <Icon name="sensor" size={25} />
            <p>Belum ada zona. Tambahkan petak untuk mulai mengatur lahan.</p>
          </div>
        ) : (
          <div className={styles["farm-zone-list"]}>
            {farmZones.map((zone, index) => (
              <div className={styles["farm-zone-row"]} key={zone.id}>
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
                    className={cn(
                      styles["device-state"],
                      zone.online
                        ? styles["online-state"]
                        : styles["offline-state"],
                    )}
                  >
                    <span className="status-dot" />
                    {zone.online
                      ? "Perangkat aktif"
                      : "Terputus / belum terhubung"}
                  </span>
                </div>
                <div className={styles["zone-row-actions"]}>
                  <button
                    className="icon-button"
                    aria-label={`Lihat perangkat ${zone.name}`}
                    onClick={() => setEditor({ type: "device", zone })}
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
                        onClick={() => setEditor({ type: "delete-zone", zone })}
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
        <div className={styles["farm-card-footer"]}>
          <span className="muted">
            <Icon name="shield" size={14} />
            {readonly ? "Pemantauan zona" : "Lahan terdaftar"}
          </span>
          <button
            className="text-link"
            onClick={() => {
              setFarmId(farm.id);
              notify(`${farm.name} dipilih untuk dashboard dan irigasi.`);
            }}
          >
            {farmId === farm.id ? "Lahan terpilih" : "Pilih lahan"}
            <Icon name={farmId === farm.id ? "check" : "arrow"} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
