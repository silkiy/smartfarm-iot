"use client";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { requestJson } from "@/lib/api-client";
import { PageHeading } from "@/components/ui/page-heading";
import { Field } from "@/components/ui/field";
import { useEffect, useState, type FormEvent } from "react";
import type { UserRole } from "@/domain/models";
type Person = {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};
export function UsersScreen() {
  const { user, farms, zones, refresh, notify } = useWorkspace();
  const [people, setPeople] = useState<Person[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [zoneId, setZoneId] = useState("");
  useEffect(() => {
    if (user.role === "FIELD_WORKER") return;
    const controller = new AbortController();
    requestJson<{ items: Person[]; total: number }>(
      `/api/users?page=${page}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((data) => {
        setPeople(data.items);
        setTotal(data.total);
        setError("");
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [user.role, page]);
  if (user.role === "FIELD_WORKER")
    return (
      <section className="panel">
        <h1>Akses terbatas</h1>
        <p>Pengguna dan penugasan dikelola admin atau pemilik lahan.</p>
      </section>
    );
  async function save(path: string, method: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      await requestJson(path, method, data);
      await refresh();
      const next = await requestJson<{ items: Person[]; total: number }>(
        `/api/users?page=${page}`,
      );
      setPeople(next.items);
      setTotal(next.total);
      notify("Perubahan berhasil disimpan.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Penyimpanan gagal.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      await save("/api/users", "POST", Object.fromEntries(new FormData(form)))
    )
      form.reset();
  }
  const currentZone = zones.find((z) => z.id === zoneId) ?? zones[0];
  const workers = people.filter((p) => p.role === "FIELD_WORKER" && p.isActive);
  return (
    <>
      <PageHeading
        title="Pengguna & penugasan"
        description="Kelola akun dan tentukan zona yang dapat diakses pekerja."
      />
      {error && (
        <div className="info-banner" role="alert">
          {error}
        </div>
      )}
      {user.role === "ADMIN" && (
        <section className="panel">
          <h2>Tambah akun</h2>
          <form onSubmit={create}>
            <div className="form-grid">
              <Field label="Nama pengguna">
                <input name="displayName" required maxLength={80} />
              </Field>
              <Field label="Email pengguna">
                <input name="email" type="email" required autoComplete="off" />
              </Field>
            </div>
            <div className="form-grid">
              <Field
                label="Kata sandi awal"
                hint="Minimal 12 karakter; berikan secara pribadi."
              >
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={72}
                  required
                />
              </Field>
              <Field label="Peran pengguna">
                <select name="role">
                  <option value="LANDOWNER">Pemilik lahan</option>
                  <option value="FIELD_WORKER">Pekerja lapangan</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
            </div>
            <button className="button button-primary" disabled={busy}>
              Simpan akun
            </button>
          </form>
        </section>
      )}
      <section className="panel">
        <h2>Daftar pengguna</h2>
        {people.map((p) => (
          <div key={p.userId} className="section-toolbar">
            <div>
              <strong>{p.displayName}</strong>
              <p>
                {p.email} · {p.role} · {p.isActive ? "Aktif" : "Nonaktif"}
              </p>
            </div>
            {user.role === "ADMIN" && p.role !== "ADMIN" && (
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={() =>
                  void save(`/api/users/${p.userId}`, "PATCH", {
                    isActive: !p.isActive,
                  })
                }
              >
                {p.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            )}
          </div>
        ))}
        {user.role === "ADMIN" && (
          <details>
            <summary>Atur ulang kata sandi pengguna</summary>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                if (
                  await save(`/api/users/${data.get("userId")}`, "PATCH", {
                    password: data.get("password"),
                  })
                )
                  form.reset();
              }}
            >
              <Field label="Pengguna yang direset">
                <select name="userId" required>
                  {people
                    .filter((p) => p.role !== "ADMIN")
                    .map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.displayName} · {p.email}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Kata sandi baru">
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </Field>
              <button
                className="button button-secondary"
                disabled={busy || !people.some((p) => p.role !== "ADMIN")}
              >
                Simpan kata sandi baru
              </button>
            </form>
          </details>
        )}
        <div className="dialog-actions">
          <button
            className="button button-secondary"
            disabled={page === 1 || busy}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </button>
          <span>Halaman {page}</span>
          <button
            className="button button-secondary"
            disabled={page * 100 >= total || busy}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      </section>
      {currentZone && (
        <section className="panel">
          <h2>Penugasan pekerja</h2>
          <Field label="Zona penugasan">
            <select
              value={currentZone.id}
              onChange={(e) => setZoneId(e.target.value)}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {farms.find((f) => f.id === z.farmId)?.name} · {z.name}
                </option>
              ))}
            </select>
          </Field>
          <form
            key={currentZone.id + currentZone.assignedUserIds.join(",")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void save(`/api/zones/${currentZone.id}/assignments`, "PUT", {
                assignedUserIds: data.getAll("assigned"),
                controlUserIds: currentZone.controlUserIds.filter((id) =>
                  data.getAll("assigned").includes(id),
                ),
              });
            }}
          >
            <p>
              Pekerja yang ditugaskan dapat melihat zona ini. Kendali perangkat
              belum tersedia.
            </p>
            {!workers.length && (
              <p>Belum ada pekerja aktif pada halaman ini.</p>
            )}
            {workers.map((p) => (
              <label key={p.userId} className="section-toolbar">
                <input
                  type="checkbox"
                  name="assigned"
                  value={p.userId}
                  defaultChecked={currentZone.assignedUserIds.includes(
                    p.userId,
                  )}
                />
                {p.displayName}
              </label>
            ))}
            <button
              className="button button-primary"
              disabled={busy || total > 100}
            >
              Simpan penugasan
            </button>
            {total > 100 && (
              <p>
                Penugasan massal memerlukan daftar lengkap; saat ini dibatasi
                hingga 100 pengguna.
              </p>
            )}
          </form>
        </section>
      )}
      {user.role === "ADMIN" && farms.length > 0 && (
        <section className="panel">
          <h2>Kepemilikan lahan</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void save(`/api/farms/${data.get("farmId")}/owner`, "PUT", {
                ownerUserId: data.get("ownerUserId"),
              });
            }}
          >
            <Field label="Lahan yang dialihkan">
              <select name="farmId">
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pemilik baru">
              <select name="ownerUserId" required>
                {people
                  .filter((p) => p.isActive && p.role !== "FIELD_WORKER")
                  .map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.displayName}
                    </option>
                  ))}
              </select>
            </Field>
            <button className="button button-primary" disabled={busy}>
              Simpan pemilik
            </button>
          </form>
        </section>
      )}
    </>
  );
}
