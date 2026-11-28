import { Suspense } from "react";
import { AddDeviceForm } from "@/components/devices/AddDeviceForm";
import { DeviceList } from "@/components/devices/DeviceList";

export default function DevicesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-tight">Perangkat</h1>
        <p className="text-sm text-foreground/70">Daftarkan perangkat ESP32 Anda. Hanya perangkat milik Anda yang tampil.</p>
      </header>

      <section aria-labelledby="add-device" className="flex flex-col gap-4 rounded-md border border-line bg-surface p-5">
        <h2 id="add-device" className="text-sm font-semibold">Tambah Perangkat</h2>
        <AddDeviceForm />
      </section>

      <section aria-labelledby="device-list" className="flex flex-col gap-4">
        <h2 id="device-list" className="text-sm font-semibold">Perangkat Saya</h2>
        <Suspense fallback={<p className="text-sm text-foreground/70">Memuat perangkat…</p>}>
          <DeviceList />
        </Suspense>
      </section>
    </main>
  );
}
