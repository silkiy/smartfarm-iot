"use client";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { requestJson } from "@/lib/api-client";
import type { Farm, Zone } from "@/features/workspace/types";
import { useId, useState, type FormEvent } from "react";

export function FarmForm({
  farm,
  onClose,
}: {
  farm?: Farm;
  onClose: () => void;
}) {
  const { saveFarm, busy } = useWorkspace();
  const formId = useId();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const next = {
      name: String(form.get("name")).trim(),
      location: String(form.get("location")).trim(),
      areaM2: Number(form.get("area")),
      phase: String(form.get("phase")) as
        "Vegetatif" | "Generatif" | "Pematangan",
      latitude: String(form.get("latitude")).trim()
        ? Number(form.get("latitude"))
        : null,
      longitude: String(form.get("longitude")).trim()
        ? Number(form.get("longitude"))
        : null,
    };
    if (!next.name || !next.location) return;
    if (await saveFarm(next, farm?.id)) onClose();
    else
      setError(
        "Lahan belum tersimpan. Periksa isian dan koneksi, lalu coba lagi.",
      );
  }
  return (
    <Dialog
      title={farm ? "Ubah lahan" : "Tambah lahan"}
      onClose={onClose}
      footer={
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="button button-primary"
            type="submit"
            form={formId}
            disabled={busy}
          >
            <Icon name="check" size={16} />
            {busy ? "Menyimpan…" : "Simpan lahan"}
          </button>
        </div>
      }
    >
      <p>
        Simpan informasi lahan Anda. Koordinat opsional digunakan untuk
        informasi cuaca.
      </p>
      <form id={formId} onSubmit={submit} className="form-stack">
        {error && (
          <div className="info-banner" role="alert">
            {error}
          </div>
        )}
        <Field label="Nama lahan">
          <input
            name="name"
            required
            maxLength={70}
            pattern=".*\S.*"
            placeholder="Contoh: Sawah Padi Blok C"
            defaultValue={farm?.name}
          />
        </Field>
        <Field label="Lokasi">
          <input
            name="location"
            required
            maxLength={100}
            pattern=".*\S.*"
            placeholder="Kecamatan, Kabupaten"
            defaultValue={farm?.location}
          />
        </Field>
        <div className="form-grid">
          <Field label="Luas lahan (m²)">
            <input
              name="area"
              type="number"
              required
              min="1"
              max="10000000"
              placeholder="2500"
              defaultValue={
                farm ? Number(farm.area.replaceAll(".", "")) : undefined
              }
            />
          </Field>
          <Field label="Fase pertumbuhan">
            <select name="phase" defaultValue={farm?.phase ?? "Vegetatif"}>
              <option>Vegetatif</option>
              <option>Generatif</option>
              <option>Pematangan</option>
            </select>
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Lintang (opsional)">
            <input
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              defaultValue={farm?.latitude ?? ""}
              placeholder="-7.1"
            />
          </Field>
          <Field label="Bujur (opsional)">
            <input
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              defaultValue={farm?.longitude ?? ""}
              placeholder="112.4"
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
export function ZoneForm({
  farmId,
  zone,
  onClose,
}: {
  farmId: string;
  zone?: Zone;
  onClose: () => void;
}) {
  const { saveZone, busy } = useWorkspace();
  const formId = useId();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) return;
    if (await saveZone(farmId, name, zone?.id)) onClose();
    else
      setError(
        "Zona belum tersimpan. Periksa isian dan koneksi, lalu coba lagi.",
      );
  }
  return (
    <Dialog
      title={zone ? "Ubah zona" : "Tambah zona"}
      onClose={onClose}
      footer={
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="button button-primary"
            type="submit"
            form={formId}
            disabled={busy}
          >
            Simpan zona
          </button>
        </div>
      }
    >
      <p>Zona membantu Anda memantau dan mengatur setiap bagian lahan.</p>
      <form id={formId} onSubmit={submit} className="form-stack">
        {error && (
          <div className="info-banner" role="alert">
            {error}
          </div>
        )}
        <Field label="Nama zona">
          <input
            name="name"
            required
            maxLength={60}
            pattern=".*\S.*"
            placeholder="Contoh: Petak Selatan"
            defaultValue={zone?.name}
          />
        </Field>
        {!zone && (
          <div className="info-banner">
            <Icon name="info" size={18} />
            <p>
              Zona baru dimulai tanpa perangkat aktif. Hubungkan perangkat pada
              tahap integrasi berikutnya.
            </p>
          </div>
        )}
      </form>
    </Dialog>
  );
}

type DeviceStep = "form" | "key";

export function DeviceForm({
  farm,
  zone,
  onClose,
}: {
  farm: Farm;
  zone: Zone;
  onClose: () => void;
}) {
  const formId = useId();
  const [step, setStep] = useState<DeviceStep>("form");
  const [apiKey, setApiKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await requestJson<{ deviceId: string; apiKey: string }>(
        "/api/devices",
        "POST",
        {
          deviceId: String(form.get("deviceId")).trim(),
          name: String(form.get("name")).trim(),
          farmId: farm.id,
          zoneId: zone.id,
        },
      );
      setDeviceId(result.deviceId);
      setApiKey(result.apiKey);
      setStep("key");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pendaftaran gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey);
  }

  if (step === "key") {
    return (
      <Dialog
        title="Perangkat terdaftar"
        onClose={onClose}
        footer={
          <div className="dialog-actions">
            <button className="button button-primary" onClick={onClose}>
              Selesai
            </button>
          </div>
        }
      >
        <div className="info-banner">
          <Icon name="info" size={18} />
          <p>
            Salin API key ini sekarang —{" "}
            <strong>tidak akan ditampilkan lagi</strong>. Simpan ke firmware
            ESP32 Anda.
          </p>
        </div>
        <Field label="Device ID">
          <input readOnly value={deviceId} />
        </Field>
        <Field label="API Key (salin sekarang)">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              readOnly
              value={apiKey}
              style={{ fontFamily: "monospace", fontSize: 12, flex: 1 }}
            />
            <button
              type="button"
              className="button button-secondary"
              onClick={copyKey}
              aria-label="Salin API key"
            >
              <Icon name="check" size={16} />
            </button>
          </div>
        </Field>
        <Field label="Lahan">
          <input readOnly value={farm.name} />
        </Field>
        <Field label="Zona">
          <input readOnly value={zone.name} />
        </Field>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="Daftarkan perangkat"
      onClose={onClose}
      footer={
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="button button-primary"
            type="submit"
            form={formId}
            disabled={busy}
          >
            {busy ? "Mendaftarkan…" : "Daftarkan"}
          </button>
        </div>
      }
    >
      <p>
        Daftarkan ESP32 untuk zona <strong>{zone.name}</strong>. API key akan
        muncul sekali setelah pendaftaran — simpan ke firmware.
      </p>
      <form id={formId} onSubmit={submit} className="form-stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <Field
          label="Device ID"
          hint="Nama unik perangkat, contoh: ESP32-SAWAH-01"
        >
          <input
            name="deviceId"
            required
            maxLength={64}
            pattern=".*\S.*"
            placeholder="ESP32-SAWAH-01"
          />
        </Field>
        <Field label="Nama perangkat">
          <input
            name="name"
            required
            maxLength={80}
            pattern=".*\S.*"
            placeholder={`Sensor ${zone.name}`}
          />
        </Field>
        <div className="info-banner">
          <Icon name="info" size={18} />
          <p>
            Lahan: <strong>{farm.name}</strong> · Zona:{" "}
            <strong>{zone.name}</strong>
          </p>
        </div>
      </form>
    </Dialog>
  );
}
