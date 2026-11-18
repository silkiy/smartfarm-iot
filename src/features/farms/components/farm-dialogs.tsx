"use client";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useDemo } from "@/features/demo/demo-provider";
import type { Farm, Zone } from "@/features/demo/types";
import type { FarmEditor } from "../types";
import { FarmForm, ZoneForm } from "./farm-forms";
export function FarmDialogs({
  editor,
  onClose,
}: {
  editor: FarmEditor;
  onClose: () => void;
}) {
  const {
    farms,
    setFarms,
    zones,
    setZones,
    farmId,
    setFarmId,
    runningZone,
    stopIrrigation,
    notify,
  } = useDemo();
  function deleteFarm(farm: Farm) {
    if (
      zones.some((zone) => zone.farmId === farm.id && zone.id === runningZone)
    )
      stopIrrigation();
    setFarms((previous) => previous.filter((item) => item.id !== farm.id));
    setZones((previous) => previous.filter((zone) => zone.farmId !== farm.id));
    if (farmId === farm.id)
      setFarmId(farms.find((item) => item.id !== farm.id)?.id ?? "");
    onClose();
    notify("Lahan dan zona terkait dihapus dari sesi demo.");
  }
  function deleteZone(zone: Zone) {
    if (runningZone === zone.id) stopIrrigation();
    setZones((previous) => previous.filter((item) => item.id !== zone.id));
    onClose();
    notify("Zona dihapus dari sesi demo.");
  }
  return (
    <>
      {editor?.type === "farm" && (
        <FarmForm farm={editor.farm} onClose={() => onClose()} />
      )}
      {editor?.type === "zone" && (
        <ZoneForm
          farmId={editor.farmId}
          zone={editor.zone}
          onClose={() => onClose()}
        />
      )}
      {editor?.type === "delete-farm" && (
        <Dialog title="Hapus lahan dari demo?" onClose={() => onClose()}>
          <p>
            <strong>{editor.farm.name}</strong> beserta zona terkait akan
            dihapus dari sesi demo ini. Data contoh awal dapat dipulihkan dengan
            memuat ulang halaman.
          </p>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => onClose()}
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
        <Dialog title="Hapus zona dari demo?" onClose={() => onClose()}>
          <p>
            <strong>{editor.zone.name}</strong> akan dihapus dari sesi ini.
            Simulasi irigasi pada zona tersebut juga akan dihentikan.
          </p>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => onClose()}
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
          onClose={() => onClose()}
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
            onClick={() => onClose()}
          >
            Tutup rincian
          </button>
        </Dialog>
      )}
    </>
  );
}
