"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "error";

const MAC_PATTERN = "^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$";

export function AddDeviceForm() {
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCreatedApiKey(null);
    setCopied(false);

    setStatus("submitting");
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // No ownerId/apiKeyHash/role/mode sent; the server sets these.
        body: JSON.stringify({
          name,
          macAddress,
          ...(deviceId.trim() ? { deviceId: deviceId.trim() } : {}),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: boolean; data?: { apiKey?: string }; error?: { message?: string } }
        | null;

      if (!response.ok || !result?.ok || !result.data?.apiKey) {
        setStatus("error");
        setFormError(result?.error?.message ?? "Gagal menambahkan perangkat. Coba lagi.");
        return;
      }

      setStatus("idle");
      setName(""); setDeviceId(""); setMacAddress("");
      setCreatedApiKey(result.data.apiKey); // shown once
    } catch {
      setStatus("error");
      setFormError("Tidak dapat terhubung ke server. Coba lagi.");
    }
  }

  const disabled = status === "submitting";

  async function copyKey() {
    if (!createdApiKey) return;
    try {
      await navigator.clipboard.writeText(createdApiKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-busy={disabled}>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Nama Perangkat</label>
          <input
            id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled}
            className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="deviceId" className="text-sm font-medium text-foreground">ID Perangkat (opsional, kosongkan untuk auto-generate)</label>
          <input
            id="deviceId" name="deviceId" type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} disabled={disabled}
            className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
          <p className="text-sm text-foreground/70">Huruf/angka/-/_ (1–64). Kosongkan untuk dibuat otomatis.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="macAddress" className="text-sm font-medium text-foreground">MAC Address ESP32</label>
          <input
            id="macAddress" name="macAddress" type="text" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} disabled={disabled}
            placeholder="AA:BB:CC:DD:EE:FF" pattern={MAC_PATTERN}
            className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
          <p className="text-sm text-foreground/70">Format standar `AA:BB:CC:DD:EE:FF`.</p>
        </div>

        {formError ? (
          <p role="alert" className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">{formError}</p>
        ) : null}

        <button
          type="submit" disabled={disabled}
          className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-foreground transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {disabled ? "Menambahkan…" : "Tambah Perangkat"}
        </button>
      </form>

      {createdApiKey ? (
        <section aria-labelledby="api-key" className="rounded-md border border-accent bg-accent/10 p-4">
          <h2 id="api-key" className="text-sm font-semibold text-foreground">Device API Key (sekali lihat saja)</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Salin sekarang dan simpan di <code className="rounded bg-surface px-1">config.h</code> firmware.
            Key ini <strong>tidak akan ditampilkan lagi</strong>. Kalau hilang, gunakan Reset API Key.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 break-all rounded-md border border-line bg-surface px-3 py-2 text-sm">{createdApiKey}</code>
            <button
              type="button" onClick={copyKey}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
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
