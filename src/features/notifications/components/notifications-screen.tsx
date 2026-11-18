"use client";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeading } from "@/components/ui/page-heading";
import { useDemo } from "@/features/demo/demo-provider";
import styles from "@/features/notifications/notifications.module.css";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function Notifications() {
  const { notices, setNotices, preferences, setPreferences, role, notify } =
    useDemo();
  const [filter, setFilter] = useState("Semua");
  const [preview, setPreview] = useState(false);
  const unread = notices.filter((notice) => !notice.read).length;
  const filtered = notices.filter(
    (notice) =>
      filter === "Semua" ||
      (filter === "Belum dibaca" ? !notice.read : notice.category === filter),
  );
  const readonly = role === "Pekerja lapangan";
  function markAll() {
    setNotices((previous) =>
      previous.map((notice) => ({ ...notice, read: true })),
    );
    notify("Semua notifikasi contoh ditandai sudah dibaca.");
  }
  function testPreview() {
    setNotices((previous) => [
      {
        id: crypto.randomUUID(),
        title: "Pratinjau pesan dibuat",
        message:
          "Pesan WhatsApp hanya ditampilkan sebagai contoh. Tidak ada pesan yang dikirim ke nomor mana pun.",
        category: "Sistem",
        time: "Baru saja",
        read: false,
      },
      ...previous,
    ]);
    setPreview(true);
  }
  return (
    <>
      <PageHeading
        title="Notifikasi & peringatan"
        description="Tetap mengetahui perubahan kondisi lahan dan aktivitas irigasi."
      >
        <button
          className="button button-secondary"
          onClick={markAll}
          disabled={unread === 0}
        >
          <Icon name="check" size={17} />
          Tandai semua dibaca
        </button>
      </PageHeading>
      <div className={styles["notifications-layout"]}>
        <div className={styles["notifications-main"]}>
          <section className={cn("panel", styles["notification-feed"])}>
            <div className="panel-title">
              <h2>Kabar dari lahan Anda</h2>
              <Badge tone={unread ? "amber" : "neutral"}>
                {unread} belum dibaca
              </Badge>
            </div>
            <div
              className={styles["filter-tabs"]}
              aria-label="Filter notifikasi"
            >
              {["Semua", "Belum dibaca", "Peringatan", "Irigasi", "Sistem"].map(
                (value) => (
                  <button
                    key={value}
                    className={filter === value ? "selected" : ""}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                title="Semua sudah Anda lihat"
                description="Tidak ada notifikasi pada filter ini. Pilih filter lain untuk meninjau riwayat."
              />
            ) : (
              <div className="notice-list">
                {filtered.map((notice) => (
                  <article
                    key={notice.id}
                    className={cn(
                      styles["notice-item"],
                      notice.read ? styles["notice-read"] : "",
                    )}
                  >
                    <span
                      className={cn(
                        "icon-tile small ",
                        notice.category === "Peringatan" ? styles["amber"] : "",
                      )}
                    >
                      <Icon
                        name={
                          notice.category === "Peringatan"
                            ? "alert"
                            : notice.category === "Irigasi"
                              ? "drop"
                              : "sensor"
                        }
                        size={18}
                      />
                    </span>
                    <div className={styles["notice-content"]}>
                      <div className={styles["notice-title"]}>
                        <h3>{notice.title}</h3>
                        {!notice.read && (
                          <span className={styles["unread-indicator"]}>
                            <span className="sr-only">Belum dibaca</span>
                          </span>
                        )}
                      </div>
                      <p>{notice.message}</p>
                      <div className={styles["notice-meta"]}>
                        <span>
                          {notice.category} · {notice.time}
                        </span>
                        {!notice.read && (
                          <button
                            className="text-link"
                            onClick={() =>
                              setNotices((previous) =>
                                previous.map((item) =>
                                  item.id === notice.id
                                    ? { ...item, read: true }
                                    : item,
                                ),
                              )
                            }
                          >
                            Tandai dibaca <Icon name="check" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className={styles["notifications-aside"]}>
          <section className={cn("panel", styles["whatsapp-panel"])}>
            <div className="panel-title">
              <span className="icon-tile">
                <Icon name="message" size={24} />
              </span>
              <Badge tone="neutral">Belum dihubungkan</Badge>
            </div>
            <h2>Peringatan via WhatsApp</h2>
            <p>
              Informasi penting tentang sawah, langsung dalam percakapan Anda.
            </p>
            <div className={styles["whatsapp-status"]}>
              <span className="status-dot" />
              <span>Nomor penerima belum diatur</span>
            </div>
            <button
              className="button button-primary full-width"
              onClick={testPreview}
            >
              <Icon name="message" size={17} />
              Coba pratinjau pesan
            </button>
            <small>Pratinjau ini tidak mengirim pesan WhatsApp.</small>
          </section>
          <section className={cn("panel", styles["preference-panel"])}>
            <h2>Preferensi pemberitahuan</h2>
            <p>Pengaturan lokal untuk sesi demo ini.</p>
            {[
              {
                key: "web" as const,
                title: "Notifikasi dalam aplikasi",
                description: "Peringatan dan riwayat aktivitas",
              },
              {
                key: "whatsapp" as const,
                title: "Preferensi WhatsApp",
                description: "Tersimpan sebagai pilihan demo",
              },
            ].map((preference) => (
              <div className={styles["preference-row"]} key={preference.key}>
                <div>
                  <h3>{preference.title}</h3>
                  <p>{preference.description}</p>
                </div>
                <button
                  type="button"
                  className={`switch${preferences[preference.key] ? " switched" : ""}`}
                  role="switch"
                  aria-label={preference.title}
                  aria-checked={preferences[preference.key]}
                  disabled={readonly}
                  onClick={() => {
                    setPreferences((previous) => ({
                      ...previous,
                      [preference.key]: !previous[preference.key],
                    }));
                    notify("Preferensi contoh diperbarui.");
                  }}
                >
                  <span />
                </button>
              </div>
            ))}
            {readonly && (
              <p className="muted">
                Pengaturan dikelola pemilik lahan atau admin.
              </p>
            )}
          </section>
          <div className="quiet-note">
            <Icon name="shield" size={19} />
            <p>
              Pengaman irigasi tetap bekerja di perangkat, meskipun layanan
              notifikasi mengalami gangguan.
            </p>
          </div>
        </aside>
      </div>
      {preview && (
        <Dialog
          title="Pratinjau pesan WhatsApp"
          onClose={() => setPreview(false)}
        >
          <Badge tone="neutral">Pesan contoh · tidak dikirim</Badge>
          <div className={styles["message-preview"]}>
            <div>
              <Icon name="leaf" size={17} />
              <strong>SmartFarm IoT</strong>
            </div>
            <p>
              <strong>Peringatan kondisi lahan</strong>
            </p>
            <p>
              Kelembapan Petak Timur di Sawah Padi Blok A mencapai{" "}
              <strong>38%</strong>, dengan ketinggian air{" "}
              <strong>3,4 cm</strong>.
            </p>
            <p>
              Periksa kondisi lahan dan kebutuhan irigasi melalui dashboard
              SmartFarm.
            </p>
            <span>10.45 WIB · Contoh pesan</span>
          </div>
          <button
            className="button button-primary full-width"
            onClick={() => setPreview(false)}
          >
            Selesai melihat pratinjau
          </button>
        </Dialog>
      )}
    </>
  );
}
