"use client";
import { WorkspaceStatus } from "@/components/ui/workspace-status";

export default function PreviewError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <WorkspaceStatus
      title="Halaman belum dapat ditampilkan"
      message="Terjadi kendala saat menyiapkan halaman. Coba lagi untuk memuat data terbaru."
      onRetry={retry}
    />
  );
}
