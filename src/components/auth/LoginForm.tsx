"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "idle" | "submitting" | "error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (email.trim().length === 0 || password.length === 0) {
      setFormError("Email dan password wajib diisi.");
      return;
    }

    setStatus("submitting");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Single generic message; do not reveal whether email or password was wrong.
      if (result?.error) {
        setStatus("error");
        setFormError("Email atau password salah.");
        return;
      }

      setStatus("idle");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
      setFormError("Tidak dapat terhubung ke server. Coba lagi.");
    }
  }

  const disabled = status === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-busy={disabled}>
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
          className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-line bg-surface px-3 py-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
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
        {disabled ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
