"use client";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import type { Zone } from "@/features/workspace/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import styles from "../dashboard.module.css";

export function ZoneCard({ zone, index }: { zone: Zone; index: number }) {
  const { setSelectedZoneId } = useWorkspace();
  return (
    <section
      className={cn(
        cn("panel", styles["zone-card"]),
        !zone.online ? styles["zone-offline"] : "",
      )}
      key={zone.id}
    >
      <div className="panel-title">
        <div className={styles["zone-name"]}>
          <span className="zone-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3>{zone.name}</h3>
        </div>
        <Badge
          tone={
            !zone.online ? "neutral" : zone.moisture < 40 ? "amber" : "green"
          }
        >
          {!zone.online
            ? "Terputus"
            : zone.moisture < 40
              ? "Mulai kering"
              : "Cukup air"}
        </Badge>
      </div>
      <div data-testid="zone-readings" className={styles["zone-readings"]}>
        <div>
          <span>
            <Icon name="leaf" size={15} />
            Kelembapan
          </span>
          <strong>
            {zone.hasReading === false ? "—" : zone.moisture}
            {zone.hasReading !== false && <small>%</small>}
          </strong>
        </div>
        <div>
          <span>
            <Icon name="drop" size={15} />
            Level air
          </span>
          <strong>
            {zone.hasReading === false
              ? "—"
              : zone.water.toFixed(1).replace(".", ",")}
            {zone.hasReading !== false && <small>cm</small>}
          </strong>
        </div>
      </div>
      <div className={styles["zone-footer"]}>
        <span className="muted">
          <span
            className={`status-dot ${zone.online ? "green-dot" : "grey-dot"}`}
          />
          {zone.hasReading === false
            ? "Belum ada pembacaan"
            : zone.online
              ? "Data tersimpan"
              : "Pembacaan tersimpan"}
        </span>
        <Link
          href="/irigasi"
          onClick={() => setSelectedZoneId(zone.id)}
          aria-label={`Kontrol irigasi ${zone.name}`}
        >
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </section>
  );
}
