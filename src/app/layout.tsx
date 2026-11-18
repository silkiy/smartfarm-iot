import type { Metadata } from "next";
import localFont from "next/font/local";
import { DemoProvider } from "@/components/smartfarm/demo-provider";
import "./globals.css";
import "./workspace.css";

const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans.ttf",
  variable: "--font-jakarta",
  display: "swap",
  weight: "400 800",
});

export const metadata: Metadata = {
  title: "SmartFarm IoT",
  description: "Monitoring dan otomatisasi irigasi sawah",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
