"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Busy = null | "reset" | "delete";

/** Per-device actions: Reset API Key + Hapus. Confirm before irreversible delete. No apiKeyHash shown. */
export function DeviceActions({ deviceId, name }: { deviceId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetKey, setResetKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function resetApiKey() {
    setError(null); setResetKey(null); setCopied(false); setBusy("reset");
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(deviceId)}/reset-key`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: { apiKey?: string }; error?: { message?: string } } | null;
      if (!res.ok || !json?.ok || !json.data?.apiKey) {
        setError(json?.error?.message ?? "Gagal mereset API key. Coba lagi.");
        return;
      }
      setResetKey(json.data.apiKey); // shown once
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteDevice() {
    setError(null); setBusy("delete");
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(deviceId)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(json?.error?.message ?? "Gagal menghapus perangkat. Coba lagi.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setBusy(null);
    }
  }

  async function copyKey() {
    if (!resetKey) return;
    try { await navigator.clipboard.writeText(resetKey); setCopied(true); } catch { setCopied(false); }
  }

  const disabled = busy !== null;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button" onClick={resetApiKey} disabled={disabled}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "reset" ? "Mereset…" : "Reset API Key"}
        </button>

        {!confirmDelete ? (
          <button
            type="button" onClick={() => setConfirmDelete(true)} disabled={disabled}
            className="rounded-md border border-error bg-surface px-3 py-1.5 text-xs font-medium text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-60"
          >
            Hapus
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-2" role="group" aria-label={`Konfirmasi hapus ${name}`}>
            <span className="text-xs text-foreground/70">Yakin hapus perangkat ini?</span>
            <button
              type="button" onClick={deleteDevice} disabled={disabled}
              className="rounded-md border border-error bg-error/10 px-3 py-1.5 text-xs font-medium text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-60"
            >
              {busy === "delete" ? "Menghapus…" : "Ya, hapus"}
            </button>
            <button
              type="button" onClick={() => setConfirmDelete(false)} disabled={disabled}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-60"
            >
              Batal
            </button>
          </span>
        )}
      </div>

      {error ? <p role="alert" className="rounded-md border border-error bg-error/10 px-3 py-2 text-xs text-error">{error}</p> : null}

      {resetKey ? (
        <section aria-labelledby={`reset-key-${deviceId}`} className="rounded-md border border-accent bg-accent/10 p-3">
          <h3 id={`reset-key-${deviceId}`} className="text-xs font-semibold text-foreground">Device API Key baru (sekali lihat saja)</h3>
          <p className="mt-1 text-xs text-foreground/70">Salin sekarang; key lama sudah tidak berlaku. Tidak akan ditampilkan lagi.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 break-all rounded-md border border-line bg-surface px-3 py-2 text-xs">{resetKey}</code>
            <button
              type="button" onClick={copyKey}
              className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
          <p aria-live="polite" className="sr-only">{copied ? "API key tersalin" : ""}</p>
        </section>
      ) : null}
    </div>
  );
}
