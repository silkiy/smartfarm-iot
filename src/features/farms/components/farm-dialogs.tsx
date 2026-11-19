"use client";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import type { Farm, Zone } from "@/features/workspace/types";
import type { FarmEditor } from "../types";
import { FarmForm, ZoneForm } from "./farm-forms";
import { useState } from "react";
export function FarmDialogs({
  editor,
  onClose,
}: {
  editor: FarmEditor;
  onClose: () => void;
}) {
  const { removeFarm, removeZone, busy } = useWorkspace();
  const [error, setError] = useState("");
  function close() {
    setError("");
    onClose();
  }
  async function deleteFarm(farm: Farm) {
    if (await removeFarm(farm.id)) close();
    else
      setError(
        "Lahan belum dapat diarsipkan. Coba lagi setelah koneksi pulih.",
      );
  }
  async function deleteZone(zone: Zone) {
    if (await removeZone(zone.id)) close();
    else
      setError("Zona belum dapat diarsipkan. Coba lagi setelah koneksi pulih.");
  }
  return (
    <>
      {editor?.type === "farm" && (
        <FarmForm farm={editor.farm} onClose={close} />
      )}
      {editor?.type === "zone" && (
        <ZoneForm farmId={editor.farmId} zone={editor.zone} onClose={close} />
      )}
      {editor?.type === "delete-farm" && (
        <Dialog
          title="Hapus lahan?"
          onClose={close}
          footer={
            <div className="dialog-actions">
              <button className="button button-secondary" onClick={close}>
                Batal
              </button>
              <button
                className="button button-danger"
                disabled={busy}
                onClick={() => deleteFarm(editor.farm)}
              >
                Hapus lahan
              </button>
            </div>
          }
        >
          <p>
            <strong>{editor.farm.name}</strong> beserta zona terkait akan
            diarsipkan. Riwayat tersimpan tetap dipertahankan.
          </p>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </Dialog>
      )}
      {editor?.type === "delete-zone" && (
        <Dialog
          title="Hapus zona?"
          onClose={close}
          footer={
            <div className="dialog-actions">
              <button className="button button-secondary" onClick={close}>
                Batal
              </button>
              <button
                className="button button-danger"
                disabled={busy}
                onClick={() => deleteZone(editor.zone)}
              >
                Hapus zona
              </button>
            </div>
          }
        >
          <p>
            <strong>{editor.zone.name}</strong> akan diarsipkan dan tidak muncul
            pada daftar zona aktif.
          </p>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </Dialog>
      )}
      {editor?.type === "device" && (
        <Dialog title={`Perangkat ${editor.zone.name}`} onClose={close}>
          <Badge tone={editor.zone.online ? "green" : "neutral"}>
            {editor.zone.online
              ? "Perangkat aktif"
              : "Terputus / belum terhubung"}
          </Badge>
          <div className="dialog-summary">
            <div>
              <span>Pengendali</span>
              <strong>Belum terdaftar</strong>
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
          <button className="button button-primary full-width" onClick={close}>
            Tutup rincian
          </button>
        </Dialog>
      )}
    </>
  );
}
