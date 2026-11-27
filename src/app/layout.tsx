import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "SmartFarm Hidroponik",
  description: "Sistem monitoring dan otomatisasi hidroponik berbasis IoT",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
