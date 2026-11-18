import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { Farm } from "@/features/demo/types";
import Image from "next/image";
import Link from "next/link";
import styles from "../dashboard.module.css";

export function FarmOverview({
  farm,
  zoneCount,
}: {
  farm: Farm;
  zoneCount: number;
}) {
  return (
    <div className={styles["overview-grid"]}>
      <section className={styles["farm-hero"]}>
        <Image
          src="/images/rice-fields.jpg"
          alt="Hamparan sawah hijau sebagai ilustrasi lahan"
          fill
          sizes="(min-width: 1100px) 55vw, 100vw"
          loading="eager"
        />
        <div className={styles["farm-hero-shade"]} />
        <div className={styles["farm-hero-content"]}>
          <span className="photo-label">
            <Icon name="leaf" size={15} />
            Sawah Anda, terpantau
          </span>
          <div>
            <p className={styles["hero-location"]}>
              <Icon name="pin" size={16} />
              {farm.location}
            </p>
            <h2>{farm.name}</h2>
            <div className={styles["hero-details"]}>
              <span>{farm.area} m²</span>
              <span>{zoneCount} zona</span>
              <span>Fase {farm.phase.toLowerCase()}</span>
            </div>
          </div>
          <Link href="/lahan" className={styles["hero-link"]}>
            Lihat detail lahan <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>
      <section className={styles["weather-panel"]}>
        <div className="panel-title">
          <h2>Cuaca sekitar lahan</h2>
          <Badge tone="neutral">Contoh</Badge>
        </div>
        <div className={styles["weather-main"]}>
          <div>
            <strong>
              28<span>°C</span>
            </strong>
            <p>Cerah berawan</p>
          </div>
          <div className={styles["weather-art"]}>
            <Icon name="sun" size={65} />
            <Icon name="cloud" size={62} />
          </div>
        </div>
        <div className={styles["weather-details"]}>
          <span>
            <Icon name="drop" size={17} />
            Kelembapan <strong>76%</strong>
          </span>
          <span>
            <Icon name="wind" size={17} />
            Angin <strong>8 km/j</strong>
          </span>
        </div>
        <p className={styles["weather-note"]}>
          Ilustrasi cuaca untuk {farm.location}
        </p>
      </section>
    </div>
  );
}
