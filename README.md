# SmartFarm IoT

Website monitoring dan pengelolaan irigasi sawah berbasis Next.js, MongoDB Atlas, Auth.js, dan ESP32.

Frontend kini menggunakan backend dan MongoDB untuk login, akses tiga peran, lahan/zona, akun pengguna, kepemilikan, penugasan, rancangan aturan, notifikasi, preferensi, serta laporan. Cuaca memakai Open-Meteo. Integrasi sensor dan aktuator menunggu hardware.

## Mulai

```bash
npm ci
```

Isi environment server sesuai `.env.example`: `MONGODB_URI` dan `AUTH_SECRET`. File `.env.local` yang sudah berisi konfigurasi Anda tidak perlu ditimpa. Untuk setup baru, salin contoh dan isi nilainya. Jangan memakai `NEXT_PUBLIC_` untuk credential database atau token.

```bash
npm run bootstrap:admin
npm run dev
```

CLI meminta email, nama, dan kata sandi admin; kata sandi tidak ditampilkan. Buka [localhost:3000](http://localhost:3000), lalu masuk. Admin membuat akun pemilik/pekerja melalui profil → **Pengguna & penugasan**. Tidak ada akun/password bawaan atau pendaftaran publik.

## Halaman

| Route         | Fungsi                                                             |
| ------------- | ------------------------------------------------------------------ |
| `/login`      | Login akun nyata                                                   |
| `/dashboard`  | Ringkasan lahan, pembacaan tersimpan jika tersedia, dan cuaca      |
| `/lahan`      | Pengelolaan lahan dan zona                                         |
| `/irigasi`    | Rancangan aturan tersimpan; kontrol perangkat masih nonaktif       |
| `/analisis`   | Filter data database, grafik, CSV dan cetak laporan                |
| `/notifikasi` | Notifikasi, status baca per akun, preferensi dan kesiapan WhatsApp |
| `/pengguna`   | Admin: akun/kepemilikan; pemilik: penugasan pekerja                |

`/` mengalihkan ke `/dashboard`; sesi yang belum masuk diarahkan ke `/login`. Otorisasi dilakukan pada setiap endpoint berdasarkan profil aktif, peran, kepemilikan lahan dan penugasan zona. Data kosong tidak diganti dengan angka sensor/kejadian irigasi buatan.

## Pemeriksaan

```bash
npm run check
npm run build
```

Test browser memerlukan MongoDB pengujian khusus dengan nama `smartfarm_test_*` dan Chromium/Chrome. Lihat petunjuk lengkap dan batas integrasi dalam [BACKEND.md](BACKEND.md).

## Panduan

- [Backend, konfigurasi akun, API, cuaca, WhatsApp dan pengujian](BACKEND.md)
- [Arsitektur dan lokasi kode](ARCHITECTURE.md)
- [Maintenance dan perintah rutin](CONTRIBUTING.md)

UI mengikuti enam layar Stitch dengan sidebar desktop dan navigasi bawah pada ponsel. Plus Jakarta Sans dan gambar di-host lokal; lisensi font berada di `src/assets/fonts/OFL.txt`.
