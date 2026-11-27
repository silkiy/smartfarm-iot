import { Suspense } from "react";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Dashboard — Smartfarm IoT" };

/**
 * Minimal protected placeholder so Task 4 redirects + Task 5 protection work.
 * Real dashboard (metrics, device switcher, Figma /dashboard, data wiring) is
 * Task 15; not implemented here.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold leading-tight">Dashboard</h1>
      <Suspense fallback={<p className="text-sm text-foreground/70">Memuat…</p>}>
        <DashboardUser />
      </Suspense>
    </main>
  );
}

async function DashboardUser() {
  const user = await requireSession();

  return (
    <>
      <p className="text-sm text-foreground/70">
        Masuk sebagai <span className="font-medium text-foreground">{user.name || user.email}</span>
        {" · "}
        role <span className="font-medium text-foreground">{user.role}</span>
      </p>
      <p className="text-sm leading-relaxed text-foreground/70">
        Ini halaman placeholder. Kartu metrik real-time, device switcher, dan
        konten Figma `/dashboard` dibangun di Task 15.
      </p>
    </>
  );
}
