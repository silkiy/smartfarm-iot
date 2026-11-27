import { requireSession } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import type { DeviceDocument } from "@/lib/devices";
import { toDeviceListItem } from "@/lib/devices";

const DEVICES_COLLECTION = "devices";

/**
 * Server Component listing ONLY the current user's devices
 * (`ownerId === session.user.id`; ADMIN here still scoped to own here, no
 * global admin list in Task 7). `apiKeyHash` is never selected/returned.
 */
export async function DeviceList() {
  const session = await requireSession();
  const db = await getDb();

  const docs = await db
    .collection<DeviceDocument>(DEVICES_COLLECTION)
    .find(
      { ownerId: session.id },
      { projection: { apiKeyHash: 0, passwordHash: 0 } },
    )
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const devices = docs.map((d) => toDeviceListItem(d));

  if (devices.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground/70">
        Belum ada perangkat. Tambahkan perangkat di atas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {devices.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{d.name ?? d.deviceId}</span>
            <span className="truncate text-xs text-foreground/70">{d.deviceId} · {d.macAddress ?? "—"}</span>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
              d.status === "ONLINE"
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-foreground/70"
            }`}
          >
            {d.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
