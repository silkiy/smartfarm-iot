"use client";
import { Brand } from "@/components/layout/brand";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import styles from "@/features/auth/auth.module.css";
import { useDemo } from "@/features/demo/demo-provider";
import type { DemoRole } from "@/features/demo/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function Login() {
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { role, setRole } = useDemo();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    event.currentTarget.reset();
    router.push("/dashboard");
  }
  return (
    <main className={styles["login-page"]}>
      <section className={styles["login-story"]}>
        <Image
          src="/images/rice-fields.jpg"
          alt="Sawah berundak yang hijau di bawah cahaya pagi"
          fill
          sizes="(min-width: 900px) 50vw, 100vw"
          loading="eager"
        />
        <div className={styles["login-story-shade"]} />
        <Link href="/dashboard" className={styles["login-brand"]}>
          <Brand />
        </Link>
        <div className={styles["login-story-copy"]}>
          <span className="photo-label">
            <Icon name="leaf" size={16} />
            Lebih dekat dengan lahan Anda
          </span>
          <h1>
            Sawah terawat.
            <br />
            Setiap tetes berarti.
          </h1>
          <p>
            Pantau kondisi tanah dan air, lalu atur irigasi dari satu tempat
            yang sederhana.
          </p>
          <div className={styles["login-story-location"]}>
            <Icon name="pin" size={18} />
            <span>Terinspirasi dari sawah Tikung, Lamongan</span>
          </div>
        </div>
        <span className={styles["login-photo-credit"]}>
          SmartFarm IoT · Pertanian yang lebih terarah
        </span>
      </section>
      <section className={styles["login-form-side"]}>
        <div className={styles["login-mobile-brand"]}>
          <Brand />
        </div>
        <div className={styles["login-form-wrap"]}>
          <span className="demo-tag">
            <span className="status-dot" />
            Pratinjau antarmuka
          </span>
          <h2>Selamat datang kembali</h2>
          <p className={styles["login-intro"]}>
            Satu tempat untuk mengenali dan merawat sawah Anda.
          </p>
          <form onSubmit={submit} className={styles["login-form"]}>
            <Field label="Alamat email">
              <div className={styles["input-with-icon"]}>
                <Icon name="mail" />
                <input
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="nama@contoh.com"
                  required
                />
              </div>
            </Field>
            <Field
              label="Kata sandi demo"
              hint="Gunakan isian contoh. Formulir ini belum memverifikasi akun."
            >
              <div className={styles["input-with-icon"]}>
                <Icon name="lock" />
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="off"
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  required
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={
                    visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  <Icon name="eye" />
                </button>
              </div>
            </Field>
            <Field label="Jelajahi sebagai">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as DemoRole)}
              >
                <option>Pemilik lahan</option>
                <option>Admin</option>
                <option>Pekerja lapangan</option>
              </select>
            </Field>
            <div className={styles["login-options"]}>
              <span>
                <Icon name="shield" size={16} />
                Data contoh, tanpa akun asli
              </span>
              <button
                className="text-link"
                type="button"
                onClick={() => setHelp(true)}
              >
                Bantuan masuk
              </button>
            </div>
            <button
              type="submit"
              className="button button-primary full-width"
              disabled={loading}
            >
              {loading ? "Membuka…" : "Masuk ke demo"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <div className={styles["login-divider"]}>
            <span>atau langsung jelajahi</span>
          </div>
          <Link
            className="button button-secondary full-width"
            href="/dashboard"
          >
            Lihat dashboard demo <Icon name="arrow" size={18} />
          </Link>
          <p className={styles["login-footnote"]}>
            Monitoring tanah, pengelolaan air, dan informasi lahan dalam satu
            tampilan.
          </p>
        </div>
        <footer className={styles["login-footer"]}>
          SmartFarm IoT <span>Prototipe MPTI</span>
        </footer>
      </section>
      {help && (
        <Dialog title="Bantuan masuk" onClose={() => setHelp(false)}>
          <p>
            Anda sedang menggunakan pratinjau tampilan SmartFarm. Isi email
            contoh dan kata sandi contoh minimal 8 karakter untuk mencoba alur
            masuk.
          </p>
          <p>
            Akun, pemulihan kata sandi, dan autentikasi akan tersedia setelah
            layanan akun dihubungkan.
          </p>
          <button
            className="button button-primary full-width"
            onClick={() => setHelp(false)}
          >
            Mengerti
          </button>
        </Dialog>
      )}
    </main>
  );
}
