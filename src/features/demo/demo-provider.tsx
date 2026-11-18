"use client";
import styles from "@/features/demo/demo.module.css";
import {
  initialFarms,
  initialNotices,
  initialZones,
} from "@/features/demo/fixtures";
import type {
  DemoRole,
  Farm,
  IrrigationRule,
  Notice,
  Zone,
} from "@/features/demo/types";
import { cn } from "@/lib/cn";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type DemoContextValue = {
  farms: Farm[];
  setFarms: Dispatch<SetStateAction<Farm[]>>;
  zones: Zone[];
  setZones: Dispatch<SetStateAction<Zone[]>>;
  farmId: string;
  setFarmId: (id: string) => void;
  farm: Farm | undefined;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  rules: Record<string, IrrigationRule>;
  setRules: Dispatch<SetStateAction<Record<string, IrrigationRule>>>;
  preferences: {
    web: boolean;
    whatsapp: boolean;
  };
  setPreferences: Dispatch<
    SetStateAction<{
      web: boolean;
      whatsapp: boolean;
    }>
  >;
  notices: Notice[];
  setNotices: Dispatch<SetStateAction<Notice[]>>;
  runningZone: string | null;
  remaining: number;
  startIrrigation: (zoneId: string, seconds: number) => void;
  stopIrrigation: () => void;
  notify: (text: string) => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState(initialFarms);
  const [zones, setZones] = useState(initialZones);
  const [farmId, setFarmId] = useState("farm-a");
  const [role, setRole] = useState<DemoRole>("Pemilik lahan");
  const [selectedZoneId, setSelectedZoneId] = useState("zone-1");
  const [rules, setRules] = useState<Record<string, IrrigationRule>>({});
  const [preferences, setPreferences] = useState({
    web: true,
    whatsapp: false,
  });
  const [notices, setNotices] = useState(initialNotices);
  const [runningZone, setRunningZone] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!runningZone || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [runningZone, remaining]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const activeZone = remaining > 0 ? runningZone : null;
  function startIrrigation(zoneId: string, seconds: number) {
    setRunningZone(zoneId);
    setRemaining(Math.min(15, Math.max(1, seconds)));
    setToast("Simulasi irigasi dimulai. Perangkat fisik tidak diaktifkan.");
  }
  function stopIrrigation() {
    setRunningZone(null);
    setRemaining(0);
    setToast("Simulasi dihentikan. Pompa mati dan katup tertutup.");
  }
  return (
    <DemoContext.Provider
      value={{
        farms,
        setFarms,
        zones,
        setZones,
        farmId,
        setFarmId,
        farm: farms.find((item) => item.id === farmId),
        role,
        setRole,
        selectedZoneId,
        setSelectedZoneId,
        rules,
        setRules,
        preferences,
        setPreferences,
        notices,
        setNotices,
        runningZone: activeZone,
        remaining,
        startIrrigation,
        stopIrrigation,
        notify: setToast,
      }}
    >
      {children}
      <div
        className={cn(styles["toast"], toast ? styles["toast-visible"] : "")}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo requires DemoProvider");
  return value;
}
