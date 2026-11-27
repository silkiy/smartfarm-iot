import { LoginForm } from "@/features/auth/login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — SmartFarm Hidroponik",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 text-white text-2xl mb-4">
            🌱
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SmartFarm</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Hidroponik Otomatis</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
