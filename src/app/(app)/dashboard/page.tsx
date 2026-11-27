import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — SmartFarm Hidroponik",
};

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitoring real-time sistem hidroponik.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-4xl mb-2">📊</p>
        <p className="text-sm">Data sensor akan tampil di sini.</p>
      </div>
    </div>
  );
}
