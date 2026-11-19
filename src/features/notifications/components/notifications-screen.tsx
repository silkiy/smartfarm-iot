"use client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useEffect, useState } from "react";
import { requestJson } from "@/lib/api-client";
import styles from "../notifications.module.css";
import { cn } from "@/lib/cn";

export function Notifications() {
  const { notices, markRead, preferences, savePreferences, busy } =
    useWorkspace();
  const [filter, setFilter] = useState("Semua");
  const [integration, setIntegration] = useState<{
    whatsappReady: boolean;
    canSendTest: boolean;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  useEffect(() => {
    requestJson<{ whatsappReady: boolean; canSendTest: boolean }>(
      "/api/integrations",
    )
      .then(setIntegration)
      .catch(() => setIntegration(null));
  }, []);
  async function sendTest() {
    if (
      !window.confirm(
        "Kirim template uji ke nomor penerima yang dikonfigurasi administrator?",
      )
    )
      return;
    setSending(true);
    try {
      const result = await requestJson<{ status: string }>(
        "/api/integrations/whatsapp/test",
        "POST",
        { requestId: crypto.randomUUID() },
      );
      setSendStatus(
        result.status === "ACCEPTED"
          ? "Permintaan diterima Meta. Status terkirim ke penerima belum dikonfirmasi."
          : "Status permintaan: " + result.status,
      );
    } catch (e) {
      setSendStatus(e instanceof Error ? e.message : "Pengiriman gagal.");
    } finally {
      setSending(false);
    }
  }
  const unread = notices.filter((n) => !n.read);
  const filtered = notices.filter(
    (n) =>
      filter === "Semua" ||
      (filter === "Belum dibaca" ? !n.read : n.category === filter),
  );
  return (
    <>
      <PageHeading
        title="Notifikasi"
        description="Riwayat pemberitahuan dan preferensi akun Anda."
      >
        <button
          className="button button-secondary"
          disabled={busy || !unread.length}
          onClick={() => void markRead(unread.map((n) => n.id))}
        >
          Tandai semua dibaca
        </button>
      </PageHeading>
      <div className={styles["notifications-layout"]}>
        <section className={cn("panel", styles["notification-feed"])}>
          <div className="panel-title">
            <h2>Kabar dari lahan Anda</h2>
            <Badge tone="neutral">{unread.length} belum dibaca</Badge>
          </div>
          <div
            className={styles["filter-tabs"]}
            role="group"
            aria-label="Filter notifikasi"
          >
            {["Semua", "Belum dibaca", "Peringatan", "Irigasi", "Sistem"].map(
              (f) => (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ),
            )}
          </div>
          {!filtered.length ? (
            <EmptyState
              title="Belum ada notifikasi"
              description="Pemberitahuan yang sesuai dengan akses Anda akan muncul di sini."
            />
          ) : (
            filtered.map((n) => (
              <article
                className={cn(
                  styles["notice-item"],
                  n.read && styles["notice-read"],
                )}
                key={n.id}
              >
                <div className={styles["notice-content"]}>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  <div className={styles["notice-meta"]}>
                    <span>{n.category}</span>
                    <time dateTime={n.time}>
                      {new Date(n.time).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </time>
                  </div>
                  {!n.read && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => void markRead([n.id])}
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
        <aside className={styles["notifications-aside"]}>
          <section className="panel">
            <h2>Preferensi pemberitahuan</h2>
            <p>Disimpan untuk akun Anda.</p>
            {(["web", "whatsapp"] as const).map((key) => (
              <div key={key} className={styles["preference-row"]}>
                <span>
                  {key === "web"
                    ? "Notifikasi dalam aplikasi"
                    : "Preferensi WhatsApp"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-label={
                    key === "web"
                      ? "Notifikasi dalam aplikasi"
                      : "Preferensi WhatsApp"
                  }
                  aria-checked={preferences[key]}
                  className={`switch${preferences[key] ? " switched" : ""}`}
                  disabled={busy}
                  onClick={() =>
                    void savePreferences({
                      ...preferences,
                      [key]: !preferences[key],
                    })
                  }
                >
                  <span />
                </button>
              </div>
            ))}
            <p className={styles["preference-note"]}>
              Preferensi WhatsApp belum mengaktifkan pengiriman. Kanal harus
              dikonfigurasi administrator terlebih dahulu.
            </p>
          </section>
          <section className="panel form-stack">
            <h2>WhatsApp Cloud API</h2>
            <Badge tone="neutral">
              {integration?.whatsappReady
                ? "Siap untuk uji"
                : "Belum dikonfigurasi"}
            </Badge>
            <p>
              Token API, nomor pengirim, template, dan penerima uji diperlukan
              untuk pengiriman resmi.
            </p>
            <button
              className="button button-secondary"
              disabled={
                !integration?.whatsappReady ||
                !integration?.canSendTest ||
                sending
              }
              onClick={() => void sendTest()}
            >
              {sending ? "Mengirim…" : "Kirim pesan uji"}
            </button>
            {sendStatus && <p role="status">{sendStatus}</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
