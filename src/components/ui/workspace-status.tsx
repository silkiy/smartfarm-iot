import { Brand } from "@/components/layout/brand";

export function WorkspaceStatus({
  title = "Menyiapkan ruang kerja",
  message = "Memuat akun dan informasi lahan Anda…",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <main className="workspace-status">
      <section className="panel stack" aria-busy={!onRetry}>
        <Brand />
        <div className="form-stack" role={onRetry ? "alert" : "status"}>
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
        {onRetry ? (
          <button className="button button-primary" onClick={onRetry}>
            Coba lagi
          </button>
        ) : (
          <div className="loading-placeholder" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </section>
    </main>
  );
}
