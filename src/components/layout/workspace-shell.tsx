"use client";
import styles from "@/components/layout/workspace.module.css";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDemo } from "@/features/demo/demo-provider";
import type { DemoRole } from "@/features/demo/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";

const navigation: {
  href: string;
  label: string;
  icon: IconName;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/irigasi", label: "Irigasi", icon: "drop" },
  { href: "/analisis", label: "Analisis", icon: "chart" },
  { href: "/notifikasi", label: "Notifikasi", icon: "bell" },
  { href: "/lahan", label: "Lahan & sensor", icon: "farm" },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { role, setRole, notices, runningZone, remaining } = useDemo();
  const unread = notices.filter((item) => !item.read).length;
  return (
    <div className={styles["app-shell"]}>
      <a className={styles["skip-link"]} href="#main-content">
        Lewati ke konten
      </a>
      <aside className={styles["sidebar"]}>
        <Link href="/dashboard">
          <Brand />
        </Link>
        <div className={styles["sidebar-caption"]}>Ruang kerja pertanian</div>
        <nav aria-label="Navigasi utama">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                styles["nav-link"],
                pathname === item.href ? styles["active"] : "",
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.href === "/notifikasi" && unread > 0 && (
                <span className={styles["nav-count"]}>{unread}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className={styles["sidebar-bottom"]}>
          <div className={styles["sidebar-note"]}>
            <Icon name="leaf" size={25} />
            <h3>Tumbuh lebih terarah.</h3>
            <p>Kenali kondisi sawah, atur air sesuai kebutuhan.</p>
            <span className={styles["little-leaves"]} aria-hidden="true">
              ⌁
            </span>
          </div>
          <Link href="/login" className={styles["nav-link"]}>
            <Icon name="logout" />
            Keluar dari demo
          </Link>
          <div className={styles["sidebar-footer"]}>
            SmartFarm IoT · Prototipe MPTI
          </div>
        </div>
      </aside>
      <div className={styles["workspace"]}>
        <header className={styles["topbar"]}>
          <Link className={styles["mobile-brand"]} href="/dashboard">
            <Brand />
          </Link>
          <div className={styles["breadcrumb"]}>
            Ruang kerja <Icon name="chevron" size={14} />
            <strong>
              {navigation.find((item) => item.href === pathname)?.label}
            </strong>
          </div>
          <div className={styles["topbar-actions"]}>
            <span className="demo-tag">
              <span className="status-dot" />
              Mode demo
            </span>
            <Link
              href="/notifikasi"
              className={cn("icon-button", styles["notification-button"])}
              aria-label={`${unread} notifikasi belum dibaca`}
            >
              <Icon name="bell" />
              {unread > 0 && <span className={styles["notification-dot"]} />}
            </Link>
            <div className={styles["profile"]}>
              <button
                className={styles["avatar"]}
                aria-label="PS: buka profil demo"
                onClick={() => setProfileOpen(true)}
              >
                PS
              </button>
              <label className={styles["profile-label"]}>
                <span>Pak Supadi</span>
                <select
                  aria-label="Pratinjau peran"
                  value={role}
                  onChange={(event) => setRole(event.target.value as DemoRole)}
                >
                  <option>Pemilik lahan</option>
                  <option>Admin</option>
                  <option>Pekerja lapangan</option>
                </select>
              </label>
            </div>
          </div>
        </header>
        <main id="main-content" className={styles["main-content"]}>
          <div className={styles["demo-strip"]}>
            <Icon name="info" size={16} />
            <span>
              Pratinjau dengan data contoh. Perubahan berlaku selama sesi demo.
            </span>
            {runningZone && (
              <Link href="/irigasi" className={styles["demo-running"]}>
                Irigasi simulasi · {remaining} dtk{" "}
                <Icon name="arrow" size={15} />
              </Link>
            )}
          </div>
          {children}
          <footer className={styles["content-footer"]}>
            <span>SmartFarm IoT</span>
            <span>Merawat sawah, menjaga setiap tetes.</span>
          </footer>
        </main>
      </div>
      <nav className={styles["bottom-nav"]} aria-label="Navigasi seluler">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? styles["active"] : ""}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <span className={styles["bottom-icon"]}>
              <Icon name={item.icon} />
              {item.href === "/notifikasi" && unread > 0 && (
                <span className={styles["notification-dot"]} />
              )}
            </span>
            <span>{item.href === "/lahan" ? "Lahan" : item.label}</span>
          </Link>
        ))}
      </nav>
      {profileOpen && (
        <Dialog title="Profil demo" onClose={() => setProfileOpen(false)}>
          <p>
            Pak Supadi · Akun contoh. Pilih peran untuk meninjau tampilan dan
            ketersediaan kontrol.
          </p>
          <Field label="Pratinjau peran">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as DemoRole)}
            >
              <option>Pemilik lahan</option>
              <option>Admin</option>
              <option>Pekerja lapangan</option>
            </select>
          </Field>
          <button
            className="button button-primary full-width"
            onClick={() => setProfileOpen(false)}
          >
            Selesai
          </button>
          <Link
            href="/login"
            className={cn(
              "button",
              "button-secondary",
              "full-width",
              styles["profile-exit"],
            )}
            onClick={() => setProfileOpen(false)}
          >
            <Icon name="logout" size={17} />
            Kembali ke halaman masuk
          </Link>
        </Dialog>
      )}
    </div>
  );
}
