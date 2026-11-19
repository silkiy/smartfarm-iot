"use client";
import { requestJson } from "@/lib/api-client";
import type { FarmInput } from "@/domain/workspace";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { IrrigationRule, WorkspaceSnapshot, WorkspaceRole } from "./types";
import styles from "./workspace.module.css";

type WorkspaceValue = WorkspaceSnapshot & {
  farmId: string;
  farm: WorkspaceSnapshot["farms"][number] | undefined;
  setFarmId: (id: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  role: WorkspaceRole;
  busy: boolean;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  saveFarm: (fields: FarmInput, id?: string) => Promise<boolean>;
  saveZone: (farmId: string, name: string, id?: string) => Promise<boolean>;
  removeFarm: (id: string) => Promise<boolean>;
  removeZone: (id: string) => Promise<boolean>;
  saveRule: (id: string, rule: IrrigationRule) => Promise<boolean>;
  markRead: (ids: string[]) => Promise<boolean>;
  savePreferences: (
    preferences: WorkspaceSnapshot["preferences"],
  ) => Promise<boolean>;
};
const Context = createContext<WorkspaceValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceSnapshot | null>(null);
  const [error, setError] = useState("");
  const [farmSelection, setFarmId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, notify] = useState("");
  const refresh = useCallback(async () => {
    setData(await requestJson<WorkspaceSnapshot>("/api/workspace"));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    requestJson<WorkspaceSnapshot>(
      "/api/workspace",
      "GET",
      undefined,
      controller.signal,
    )
      .then(setData)
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Data gagal dimuat.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function mutate(path: string, method: string, fields?: unknown) {
    setBusy(true);
    try {
      const result = await requestJson<{ id?: string }>(path, method, fields);
      try {
        await refresh();
        notify("Perubahan disimpan.");
      } catch {
        // The write succeeded. Closing the form avoids duplicate creates if a
        // subsequent refresh fails and the user retries the same submission.
        notify(
          "Data tersimpan, tetapi daftar belum dapat diperbarui. Muat ulang halaman.",
        );
      }
      return result;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Perubahan gagal disimpan.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  if (error && !data)
    return (
      <section className="panel" role="alert">
        <h1>Data belum dapat dimuat</h1>
        <p>{error}</p>
        <button
          className="button button-primary"
          onClick={() => window.location.reload()}
        >
          Coba lagi
        </button>
      </section>
    );
  if (!data)
    return (
      <p role="status" className="panel">
        Memuat ruang kerja…
      </p>
    );
  const farmId = data.farms.some((f) => f.id === farmSelection)
    ? farmSelection
    : (data.farms[0]?.id ?? "");
  const role: WorkspaceRole =
    data.user.role === "ADMIN"
      ? "Admin"
      : data.user.role === "LANDOWNER"
        ? "Pemilik lahan"
        : "Pekerja lapangan";
  return (
    <Context.Provider
      value={{
        ...data,
        farmId,
        farm: data.farms.find((f) => f.id === farmId),
        setFarmId,
        selectedZoneId,
        setSelectedZoneId,
        role,
        busy,
        notify,
        refresh,
        saveFarm: async (fields, id) => {
          const result = await mutate(
            id ? `/api/farms/${id}` : "/api/farms",
            id ? "PATCH" : "POST",
            fields,
          );
          if (result?.id) setFarmId(result.id);
          return Boolean(result);
        },
        saveZone: async (id, name, zoneId) =>
          Boolean(
            await mutate(
              zoneId ? `/api/zones/${zoneId}` : `/api/farms/${id}/zones`,
              zoneId ? "PATCH" : "POST",
              { name },
            ),
          ),
        removeFarm: async (id) =>
          Boolean(await mutate(`/api/farms/${id}`, "DELETE")),
        removeZone: async (id) =>
          Boolean(await mutate(`/api/zones/${id}`, "DELETE")),
        saveRule: async (id, rule) =>
          Boolean(await mutate(`/api/zones/${id}/rule`, "PUT", rule)),
        markRead: async (ids) =>
          Boolean(await mutate("/api/notifications/read", "PATCH", { ids })),
        savePreferences: async (preferences) =>
          Boolean(await mutate("/api/preferences", "PUT", preferences)),
      }}
    >
      {children}
      <div
        className={`${styles.toast} ${toast ? styles["toast-visible"] : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider is required");
  return value;
}
