import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — SmartFarm Hidroponik",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard 📊</h1>
      <p className="text-gray-500 mt-1">Data sensor akan tampil di sini.</p>
    </div>
  );
}
