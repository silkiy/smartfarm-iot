import Link from "next/link";

const capabilities = [
  {
    title: "Fail-safe pompa",
    body: "Relay pompa dipaksa mati saat jarak permukaan air melewati 25 cm, tanpa menunggu perintah server.",
  },
  {
    title: "Siklus otomatis",
    body: "Mode AUTO menjalankan sirkulasi 5 menit nyala dan 10 menit istirahat, dengan backup hidrasi saat media kering.",
  },
  {
    title: "Isolasi per akun",
    body: "Setiap akun hanya melihat dan mengontrol perangkat ESP32 miliknya sendiri.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-16 sm:py-24">
      <header className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold tracking-wide text-foreground">
          Smartfarm IoT
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-accent px-3 py-2 font-medium text-accent-foreground transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Buat akun
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold leading-tight text-balance sm:text-4xl">
          Pantau tandon dan media tanam kangkung dari satu dashboard.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-foreground/75">
          Platform ini menghubungkan perangkat ESP32 di rak hidroponik NFT
          dengan dashboard web: level air tandon, kelembapan media, status
          pompa, dan dispenser nutrisi terbaca serta dapat dikendalikan dari
          jarak jauh.
        </p>
      </section>

      <section aria-labelledby="kemampuan" className="flex flex-col gap-4">
        <h2
          id="kemampuan"
          className="text-sm font-semibold uppercase tracking-wider text-foreground/60"
        >
          Yang dijaga sistem
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {capabilities.map((item) => (
            <li
              key={item.title}
              className="rounded-md border border-line bg-surface p-4"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto border-t border-line pt-6 text-sm text-foreground/60">
        Sistem Informasi, Universitas Internasional Semen Indonesia.
      </footer>
    </main>
  );
}
