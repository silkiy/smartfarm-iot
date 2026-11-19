"use client";
import { minimumPasswordLength } from "@/domain/password-policy";
import { Brand } from "@/components/layout/brand";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import styles from "@/features/auth/auth.module.css";
import { signIn } from "next-auth/react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function Login() {
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (result?.error)
        setError(
          result.error === "CredentialsSignin"
            ? "Email atau kata sandi tidak valid, atau akun belum aktif."
            : "Layanan masuk belum tersedia. Silakan coba lagi atau hubungi administrator.",
        );
      else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      setError(
        "Layanan masuk belum tersedia. Silakan coba lagi atau hubungi administrator.",
      );
    } finally {
      setLoading(false);
    }
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
            Akses akun SmartFarm
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
                  autoComplete="email"
                  placeholder="nama@contoh.com"
                  required
                />
              </div>
            </Field>
            <Field
              label="Kata sandi"
              hint="Gunakan akun yang diberikan administrator."
            >
              <div className={styles["input-with-icon"]}>
                <Icon name="lock" />
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={`Minimal ${minimumPasswordLength} karakter`}
                  minLength={minimumPasswordLength}
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
            {error && <p role="alert">{error}</p>}
            <div className={styles["login-options"]}>
              <span>
                <Icon name="shield" size={16} />
                Akun pribadi dan akses sesuai peran
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
              {loading ? "Membuka…" : "Masuk"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
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
            Gunakan email dan kata sandi akun Anda. Hubungi administrator untuk
            mendapatkan akun atau mengatur ulang kata sandi.
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
