"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Username atau password salah.");
      setBusy(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">Masuk ke Dashboard</h2>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="admin"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
      >
        {busy ? "Memverifikasi..." : "Masuk"}
      </button>
    </form>
  );
}
