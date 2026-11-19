"use client";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { minimumPasswordLength } from "@/domain/password-policy";
import { personRoleLabels, type Person } from "../types";
import styles from "../users.module.css";

export function UsersList({
  people,
  page,
  total,
  busy,
  isAdmin,
  onPageChange,
  onToggle,
  onReset,
}: {
  people: Person[];
  page: number;
  total: number;
  busy: boolean;
  isAdmin: boolean;
  onPageChange: (page: number) => void;
  onToggle: (person: Person) => void;
  onReset: (userId: string, password: string) => Promise<boolean>;
}) {
  const resettable = people.filter((person) => person.role !== "ADMIN");
  return (
    <section className="panel stack" aria-labelledby="users-title">
      <div className="panel-title">
        <h2 id="users-title">Daftar pengguna</h2>
        <Badge tone="neutral">{total} akun</Badge>
      </div>
      <ul className={styles["user-list"]}>
        {people.map((person) => (
          <li key={person.userId} className={styles["user-row"]}>
            <div className={styles["user-info"]}>
              <strong>{person.displayName}</strong>
              <span className={styles["user-email"]}>{person.email}</span>
              <div className={styles["user-meta"]}>
                <span>{personRoleLabels[person.role]}</span>
                <Badge tone={person.isActive ? "green" : "neutral"}>
                  {person.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>
            {isAdmin && person.role !== "ADMIN" && (
              <button
                className="button button-secondary"
                disabled={busy}
                aria-label={`${person.isActive ? "Nonaktifkan" : "Aktifkan"} ${person.displayName}`}
                onClick={() => onToggle(person)}
              >
                {person.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {isAdmin && (
        <details className={styles["reset-panel"]}>
          <summary>Atur ulang kata sandi pengguna</summary>
          <form
            className="form-stack"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              if (
                await onReset(
                  String(data.get("userId")),
                  String(data.get("password")),
                )
              )
                form.reset();
            }}
          >
            <Field label="Pengguna yang direset">
              <select name="userId" required>
                {resettable.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.displayName} · {person.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Kata sandi baru"
              hint={`Minimal ${minimumPasswordLength} karakter.`}
            >
              <input
                type="password"
                name="password"
                required
                minLength={minimumPasswordLength}
                maxLength={72}
                autoComplete="new-password"
              />
            </Field>
            <button
              className="button button-secondary"
              disabled={busy || !resettable.length}
            >
              Simpan kata sandi baru
            </button>
          </form>
        </details>
      )}
      <nav className={styles["pagination"]} aria-label="Halaman pengguna">
        <span aria-live="polite">
          Halaman {page} dari {Math.max(1, Math.ceil(total / 100))}
        </span>
        <div className="form-actions">
          <button
            className="button button-secondary"
            disabled={page === 1 || busy}
            onClick={() => onPageChange(page - 1)}
          >
            Sebelumnya
          </button>
          <button
            className="button button-secondary"
            disabled={page * 100 >= total || busy}
            onClick={() => onPageChange(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      </nav>
    </section>
  );
}
