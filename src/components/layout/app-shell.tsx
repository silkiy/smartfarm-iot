"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/kontrol", label: "Kontrol", icon: "🎛️" },
  { href: "/riwayat", label: "Riwayat", icon: "📈" },
  { href: "/perangkat", label: "Perangkat", icon: "📡" },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Topbar */}
      <header className="bg-green-700 text-white px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌱</span>
          <span className="font-semibold text-sm tracking-tight">
            SmartFarm Hidroponik
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-100 hidden sm:block">{user.name}</span>
          <button
            onClick={() => void signOut({ redirectTo: "/login" })}
            className="text-xs bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 p-3 gap-1 shrink-0"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Konten utama */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav
        aria-label="Navigasi bawah"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
              pathname.startsWith(item.href) ? "text-green-700" : "text-gray-500",
            )}
          >
            <span className="text-xl" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
