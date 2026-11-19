"use client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeading } from "@/components/ui/page-heading";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { FarmSelect } from "@/features/farms/components/farm-select";
import { RuleForm } from "./irrigation-rule-form";
import { useState } from "react";

export function Irrigation() {
  const { zones, farmId, selectedZoneId, setSelectedZoneId } = useWorkspace();
  const [mode, setMode] = useState("manual");
  const current = zones.filter((z) => z.farmId === farmId);
  const zone = current.find((z) => z.id === selectedZoneId) ?? current[0];
  return (
    <div className="page-stack">
      <PageHeading
        title="Kontrol irigasi"
        description="Siapkan kebutuhan air per zona sebelum perangkat dihubungkan."
      >
        <Badge tone="neutral">Menunggu perangkat</Badge>
      </PageHeading>
      <div className="section-toolbar">
        <FarmSelect />
        {zone && (
          <label className="zone-select">
            <span>Zona</span>
            <select
              aria-label="Pilih zona irigasi"
              value={zone.id}
              onChange={(e) => setSelectedZoneId(e.target.value)}
            >
              {current.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
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
            description="Tambahkan zona pada halaman Lahan & sensor."
          />
        </section>
      ) : (
        <>
          <div className="segmented" aria-label="Mode pengaturan">
            <button
              aria-pressed={mode === "manual"}
              onClick={() => setMode("manual")}
            >
              Kontrol manual
            </button>
            <button
              aria-pressed={mode === "automatic"}
              onClick={() => setMode("automatic")}
            >
              Aturan otomatis
            </button>
          </div>
          {mode === "manual" ? (
            <section className="panel stack">
              <h2>{zone.name}</h2>
              <div className="info-banner">
                <Icon name="info" />
                <p>
                  Perangkat belum terhubung. Status pompa dan katup belum
                  diketahui; pengiriman perintah belum tersedia.
                </p>
              </div>
              <button className="button button-primary" disabled>
                Mulai irigasi
              </button>
            </section>
          ) : (
            <RuleForm key={zone.id} zoneId={zone.id} />
          )}
        </>
      )}
    </div>
  );
}
