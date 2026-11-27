import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — SmartFarm Hidroponik" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Hidroponik 🌱</h1>
      <p className="text-gray-500 mt-1">
        Selamat datang, {session.user.name ?? session.user.username}
      </p>
    </div>
  );
}
