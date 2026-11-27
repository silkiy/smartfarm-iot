import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — Smartfarm IoT",
  description: "Masuk ke akun Smartfarm IoT Anda.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit rounded-md text-sm text-foreground/70 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Smartfarm IoT
        </Link>
        <h1 className="text-2xl font-semibold leading-tight">Masuk</h1>
        <p className="text-sm leading-relaxed text-foreground/70">
          Masuk untuk memantau dan mengontrol perangkat hidroponik kangkung Anda.
        </p>
      </header>

      <LoginForm />

      <p className="text-sm text-foreground/70">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Buat akun
        </Link>
      </p>
    </main>
  );
}
