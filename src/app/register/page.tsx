import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Buat akun — Smartfarm IoT",
  description: "Daftar akun Smartfarm IoT untuk mengelola perangkat hidroponik kangkung Anda.",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit rounded-md text-sm text-foreground/70 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Smartfarm IoT
        </Link>
        <h1 className="text-2xl font-semibold leading-tight">Buat akun</h1>
        <p className="text-sm leading-relaxed text-foreground/70">
          Daftar untuk memantau dan mengontrol perangkat hidroponik kangkung Anda.
        </p>
      </header>

      <RegisterForm />

      <p className="text-sm text-foreground/70">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Masuk
        </Link>
      </p>
    </main>
  );
}
