import styles from "../dashboard.module.css";
export function Gauge({ value }: { value: number }) {
  return (
    <div className={styles["gauge"]}>
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle cx="90" cy="90" r="74" className={styles["gauge-track"]} />
        <circle
          cx="90"
          cy="90"
          r="74"
          className={styles["gauge-value"]}
          strokeDasharray={`${value * 4.65} 465`}
        />
      </svg>
      <div className={styles["gauge-label"]}>
        <strong>
          {value}
          <span>%</span>
        </strong>
        <span>Kelembapan rata-rata</span>
      </div>
    </div>
  );
}
