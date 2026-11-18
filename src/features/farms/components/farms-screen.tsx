"use client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeading } from "@/components/ui/page-heading";
import { useDemo } from "@/features/demo/demo-provider";
import styles from "@/features/farms/farms.module.css";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { FarmCard } from "./farm-card";
import { FarmDialogs } from "./farm-dialogs";

import type { FarmEditor } from "../types";
export function Farms() {
  const { farms, zones, role } = useDemo();
  const [editor, setEditor] = useState<FarmEditor>(null);
  const [search, setSearch] = useState("");
  const readonly = role === "Pekerja lapangan";
  const filtered = farms.filter((farm) =>
    `${farm.name} ${farm.location}`
      .toLocaleLowerCase("id-ID")
      .includes(search.toLocaleLowerCase("id-ID")),
  );

  return (
    <>
      <PageHeading
        title="Lahan & sensor"
        description="Kelola lahan, petak, dan perangkat dari satu tempat."
      >
        {!readonly && (
          <button
            className="button button-primary"
            onClick={() => setEditor({ type: "farm" })}
          >
            <Icon name="plus" size={17} />
            Tambah lahan
          </button>
        )}
      </PageHeading>
      <div className={styles["farm-summary-row"]}>
        <div>
          <span className="icon-tile small">
            <Icon name="farm" />
          </span>
          <strong>{farms.length}</strong>
          <span>lahan terdaftar</span>
        </div>
        <div>
          <span className="icon-tile small">
            <Icon name="dashboard" />
          </span>
          <strong>{zones.length}</strong>
          <span>zona pemantauan</span>
        </div>
        <div>
          <span className="icon-tile small">
            <Icon name="sensor" />
          </span>
          <strong>
            {zones.filter((zone) => zone.online).length}/{zones.length}
          </strong>
          <span>perangkat contoh aktif</span>
        </div>
      </div>
      <div className="section-toolbar">
        <label className={styles["search-field"]}>
          <Icon name="farm" size={18} />
          <input
            type="search"
            aria-label="Cari lahan"
            placeholder="Cari nama atau lokasi lahan…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Badge tone="neutral">
          {readonly ? "Akses pemantauan" : "Pengelolaan lahan"}
        </Badge>
      </div>
      {filtered.length === 0 ? (
        <section className="panel">
          <EmptyState
            title={
              farms.length === 0
                ? "Lahan pertama Anda dimulai di sini"
                : "Lahan tidak ditemukan"
            }
            description={
              farms.length === 0
                ? "Tambahkan lahan, lalu buat zona untuk mengatur pemantauan sawah."
                : "Coba nama atau lokasi lain untuk menemukan lahan."
            }
          >
            {farms.length === 0 && !readonly ? (
              <button
                className="button button-primary"
                onClick={() => setEditor({ type: "farm" })}
              >
                <Icon name="plus" />
                Tambah lahan
              </button>
            ) : search ? (
              <button
                className="button button-secondary"
                onClick={() => setSearch("")}
              >
                Hapus pencarian
              </button>
            ) : null}
          </EmptyState>
        </section>
      ) : (
        <div className={styles["farm-cards"]}>
          {filtered.map((farm, farmIndex) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              farmIndex={farmIndex}
              setEditor={setEditor}
            />
          ))}
        </div>
      )}
      <div className={cn("quiet-note", styles["farm-bottom-note"])}>
        <Icon name="info" size={20} />
        <p>
          Setiap zona dirancang untuk sensor kelembapan tanah dan ketinggian
          air. Identitas perangkat dan kalibrasi fisik dilengkapi pada tahap
          integrasi IoT.
        </p>
      </div>
      <FarmDialogs editor={editor} onClose={() => setEditor(null)} />
    </>
  );
}
