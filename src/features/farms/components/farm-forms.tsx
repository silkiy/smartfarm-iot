"use client";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useDemo } from "@/features/demo/demo-provider";
import type { Farm, Zone } from "@/features/demo/types";
import { type FormEvent } from "react";

export function FarmForm({
  farm,
  onClose,
}: {
  farm?: Farm;
  onClose: () => void;
}) {
  const { setFarms, setFarmId, notify } = useDemo();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = farm?.id ?? crypto.randomUUID();
    const next: Farm = {
      id,
      name: String(form.get("name")).trim(),
      location: String(form.get("location")).trim(),
      area: Number(form.get("area")).toLocaleString("id-ID"),
      phase: String(form.get("phase")),
    };
    if (!next.name || !next.location) return;
    setFarms((previous) =>
      farm
        ? previous.map((item) => (item.id === id ? next : item))
        : [...previous, next],
    );
    if (!farm) setFarmId(id);
    notify(
      farm
        ? "Perubahan lahan disimpan dalam sesi demo."
        : "Lahan contoh ditambahkan. Lanjutkan dengan menambah zona.",
    );
    onClose();
  }
  return (
    <Dialog title={farm ? "Ubah lahan" : "Tambah lahan"} onClose={onClose}>
      <p>
        Data tersimpan selama sesi demo. Memuat ulang halaman akan mengembalikan
        contoh awal.
      </p>
      <form onSubmit={submit}>
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
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button className="button button-primary" type="submit">
            <Icon name="check" size={16} />
            Simpan lahan
          </button>
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
  const { setZones, notify } = useDemo();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) return;
    setZones((previous) =>
      zone
        ? previous.map((item) =>
            item.id === zone.id ? { ...item, name } : item,
          )
        : [
            ...previous,
            {
              id: crypto.randomUUID(),
              farmId,
              name,
              moisture: 0,
              water: 0,
              online: false,
              hasReading: false,
            },
          ],
    );
    notify(
      zone
        ? "Nama zona diperbarui dalam sesi demo."
        : "Zona ditambahkan. Perangkat belum mengirim pembacaan sensor.",
    );
    onClose();
  }
  return (
    <Dialog title={zone ? "Ubah zona" : "Tambah zona"} onClose={onClose}>
      <p>Zona membantu Anda memantau dan mengatur setiap bagian lahan.</p>
      <form onSubmit={submit}>
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
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button className="button button-primary" type="submit">
            Simpan zona
          </button>
        </div>
      </form>
    </Dialog>
  );
}
