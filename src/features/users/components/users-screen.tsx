"use client";
import { minimumPasswordLength } from "@/domain/password-policy";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { requestJson } from "@/lib/api-client";
import { PageHeading } from "@/components/ui/page-heading";
import { Field } from "@/components/ui/field";
import { useEffect, useState, type FormEvent } from "react";
import type { Person } from "../types";
import { UsersList } from "./users-list";
import styles from "../users.module.css";
export function UsersScreen() {
  const { user, farms, zones, refresh, notify } = useWorkspace();
  const [people, setPeople] = useState<Person[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const [listState, setListState] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
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
        setListState("ready");
        setError("");
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setListState("failed");
        }
      });
    return () => controller.abort();
  }, [user.role, page, attempt]);
  if (user.role === "FIELD_WORKER")
    return (
      <section className="panel stack">
        <h1>Akses terbatas</h1>
        <p>Pengguna dan penugasan dikelola admin atau pemilik lahan.</p>
      </section>
    );
  async function save(path: string, method: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      await requestJson(path, method, data);
      try {
        await refresh();
        const next = await requestJson<{ items: Person[]; total: number }>(
          `/api/users?page=${page}`,
        );
        setPeople(next.items);
        setTotal(next.total);
        notify("Perubahan berhasil disimpan.");
      } catch {
        setError(
          "Perubahan tersimpan, tetapi daftar belum dapat diperbarui. Muat ulang halaman.",
        );
      }
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
    <div className="page-stack">
      <PageHeading
        title="Pengguna & penugasan"
        description="Kelola akun dan tentukan zona yang dapat diakses pekerja."
      />
      {error && (
        <div className="info-banner" role="alert">
          {error}
        </div>
      )}
      <div className={styles["management-layout"]}>
        <div className="stack">
          {user.role === "ADMIN" && (
            <section className="panel stack">
              <h2>Tambah akun</h2>
              <form className="form-stack" onSubmit={create}>
                <div className="form-grid">
                  <Field label="Nama pengguna">
                    <input name="displayName" required maxLength={80} />
                  </Field>
                  <Field label="Email pengguna">
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field
                    label="Kata sandi awal"
                    hint="Minimal 9 karakter; berikan secara pribadi."
                  >
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={minimumPasswordLength}
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
          <UsersList
            people={people}
            page={page}
            total={total}
            busy={busy}
            state={listState}
            onRetry={() => {
              setListState("loading");
              setAttempt((n) => n + 1);
            }}
            isAdmin={user.role === "ADMIN"}
            onPageChange={(nextPage) => {
              setListState("loading");
              setPage(nextPage);
            }}
            onToggle={(person) =>
              void save(`/api/users/${person.userId}`, "PATCH", {
                isActive: !person.isActive,
              })
            }
            onReset={(id, password) =>
              save(`/api/users/${id}`, "PATCH", { password })
            }
          />
        </div>
        {(currentZone || (user.role === "ADMIN" && farms.length > 0)) && (
          <aside className="stack" aria-label="Penugasan dan kepemilikan">
            {currentZone && (
              <section className="panel stack">
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
                  className="form-stack"
                  key={currentZone.id + currentZone.assignedUserIds.join(",")}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void save(
                      `/api/zones/${currentZone.id}/assignments`,
                      "PUT",
                      {
                        assignedUserIds: data.getAll("assigned"),
                        controlUserIds: currentZone.controlUserIds.filter(
                          (id) => data.getAll("assigned").includes(id),
                        ),
                      },
                    );
                  }}
                >
                  <p>
                    Pekerja yang ditugaskan dapat melihat zona ini. Kendali
                    perangkat belum tersedia.
                  </p>
                  {!workers.length && (
                    <p>Belum ada pekerja aktif pada halaman ini.</p>
                  )}
                  <fieldset className={styles["worker-list"]}>
                    <legend>Pekerja yang dapat mengakses zona</legend>
                    {workers.map((p) => (
                      <label key={p.userId} className={styles["worker-option"]}>
                        <input
                          type="checkbox"
                          name="assigned"
                          value={p.userId}
                          defaultChecked={currentZone.assignedUserIds.includes(
                            p.userId,
                          )}
                        />
                        <span>
                          <strong>{p.displayName}</strong>
                          <small>{p.email}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <button
                    className="button button-primary"
                    disabled={busy || total > 100}
                  >
                    Simpan penugasan
                  </button>
                  {total > 100 && (
                    <p>
                      Penugasan massal memerlukan daftar lengkap; saat ini
                      dibatasi hingga 100 pengguna.
                    </p>
                  )}
                </form>
              </section>
            )}
            {user.role === "ADMIN" && farms.length > 0 && (
              <section className="panel stack">
                <h2>Kepemilikan lahan</h2>
                <form
                  className="form-stack"
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
          </aside>
        )}
      </div>
    </div>
  );
}
