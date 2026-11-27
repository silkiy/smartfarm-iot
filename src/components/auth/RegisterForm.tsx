"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldName = "name" | "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "error";

const PASSWORD_MIN_LENGTH = 8;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (name.trim().length === 0) errors.name = "Nama wajib diisi.";
    if (!isValidEmail(email.trim())) errors.email = "Email tidak valid.";
    if (password.length < PASSWORD_MIN_LENGTH)
      errors.password = `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
    return errors;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // No `role` is sent; the server always sets USER.
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || !result?.ok) {
        setStatus("error");
        setFormError(result?.error?.message ?? "Gagal membuat akun. Coba lagi.");
        return;
      }

      setStatus("success");
      router.push("/login");
    } catch {
      setStatus("error");
      setFormError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    }
  }

  const disabled = status === "submitting" || status === "success";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-busy={disabled}>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nama
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-sm text-error">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-sm text-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          minLength={PASSWORD_MIN_LENGTH}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-sm text-error">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-sm text-foreground/70">Minimal {PASSWORD_MIN_LENGTH} karakter.</p>
        )}
      </div>

      {formError ? (
        <p role="alert" className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-foreground transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {status === "submitting" ? "Membuat akun…" : "Buat akun"}
      </button>

      <p aria-live="polite" className="sr-only">
        {status === "success" ? "Akun berhasil dibuat. Mengarahkan ke halaman masuk." : ""}
      </p>
    </form>
  );
}
