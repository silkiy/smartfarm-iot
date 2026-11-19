import { WeatherCard } from "./weather-card";
import { Icon } from "@/components/ui/icon";
import type { Farm } from "@/features/workspace/types";
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
      <WeatherCard
        key={`${farm.id}:${farm.latitude}:${farm.longitude}`}
        farmId={farm.id}
        hasCoordinates={farm.latitude != null && farm.longitude != null}
      />
    </div>
  );
}
