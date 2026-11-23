"use client";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { defaultRule } from "@/features/workspace/types";
import type { IrrigationRule } from "@/features/workspace/types";
import styles from "@/features/irrigation/irrigation.module.css";
import { cn } from "@/lib/cn";
import { useState, type FormEvent } from "react";

export function RuleForm({ zoneId }: { zoneId: string }) {
  const { rules, saveRule, busy } = useWorkspace();
  const [draft, setDraft] = useState<IrrigationRule>(
    rules[zoneId] ?? defaultRule,
  );
  async function save(event: FormEvent) {
    event.preventDefault();
    await saveRule(zoneId, draft);
  }
  return (
    <form className={cn("panel", styles["rule-panel"])} onSubmit={save}>
      <div className="panel-title">
        <div>
          <h2>Aturan irigasi otomatis</h2>
          <p>Sesuaikan kebutuhan air pada setiap fase.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.enabled}
          aria-label="Aktifkan aturan otomatis"
          className={`switch${draft.enabled ? " switched" : ""}`}
          onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
          disabled={false}
        >
          <span />
        </button>
      </div>
      <div className={styles["rule-description"]}>
        <Icon name="info" size={17} />
        <p>
          Aturan disimpan sebagai rancangan. Eksekusi otomatis menunggu
          perangkat dan kalibrasi.
        </p>
      </div>
      <fieldset disabled={busy} className={styles["form-fieldset"]}>
        <Field label="Fase pertumbuhan">
          <select
            value={draft.phase}
            onChange={(event) =>
              setDraft({ ...draft, phase: event.target.value })
            }
          >
            <option>Vegetatif</option>
            <option>Generatif</option>
            <option>Pematangan</option>
          </select>
        </Field>
        <div className="form-grid">
          <Field
            label="Ambang kelembapan (%)"
            hint="Irigasi dipertimbangkan di bawah nilai ini."
          >
            <input
              type="number"
              min="0"
              max="100"
              required
              value={draft.threshold}
              onChange={(event) =>
                setDraft({ ...draft, threshold: Number(event.target.value) })
              }
            />
          </Field>
          <Field
            label="Target ketinggian air (cm)"
            hint="Pompa berhenti saat target tercapai."
          >
            <input
              type="number"
              min="1"
              max="20"
              step="0.5"
              required
              value={draft.target}
              onChange={(event) =>
                setDraft({ ...draft, target: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        <Field
          label="Jadwal harian (WIB)"
          hint="Jadwal tersimpan. Eksekusi menunggu perangkat."
        >
          <input
            type="time"
            required
            value={draft.schedule}
            onChange={(event) =>
              setDraft({ ...draft, schedule: event.target.value })
            }
          />
        </Field>
        <div className={styles["rule-preview"]}>
          <Icon name="settings" size={20} />
          <p>
            Di bawah <strong>{draft.threshold}%</strong>, evaluasi kebutuhan
            air. Hentikan saat air mencapai <strong>{draft.target} cm</strong>{" "}
            atau batas <strong>15 detik</strong>.
          </p>
        </div>
        <button className="button button-primary" type="submit">
          <Icon name="check" size={17} />
          Simpan aturan
        </button>
      </fieldset>
    </form>
  );
}
