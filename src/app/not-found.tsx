import Link from "next/link";
import { Brand } from "@/components/layout/brand";

export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <h1>Halaman belum ditemukan</h1>
      <p>
        Alamat ini tidak tersedia. Kembali ke dashboard untuk melanjutkan
        pemantauan lahan.
      </p>
      <Link href="/dashboard" className="button button-primary">
        Kembali ke dashboard
      </Link>
    </main>
  );
}
