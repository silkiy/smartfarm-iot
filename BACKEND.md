# Backend tanpa hardware

Aplikasi memakai Next.js Route Handlers, Auth.js Credentials/JWT dan MongoDB. Halaman aplikasi memerlukan login; database baru kosong sampai admin/pemilik membuat lahan atau seeder pengembangan dijalankan. Data contoh hanya dimasukkan secara eksplisit lewat [seeder dummy](DUMMY_DATA.md), tersimpan di database dan ditandai DUMMY. Peran akun ditentukan profil database.

## Menjalankan

1. Isi `MONGODB_URI` dalam `.env.local` atau `.env`, dengan nama database pada URI. Atlas harus aktif dan Network Access mengizinkan IP pengembang. Jangan mematikan verifikasi TLS untuk melewati masalah koneksi.
2. Isi `AUTH_SECRET` dengan nilai acak yang kuat. Konfigurasi lokal saat implementasi sudah dibuat di `.env.local` yang diabaikan Git. Untuk lingkungan baru, jalankan `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` lalu simpan hasilnya ke environment server.
3. Jalankan `npm run bootstrap:admin`. Masukkan email, nama, dan kata sandi minimal 9 karakter. Isian kata sandi tidak ditampilkan. CLI juga menerima `ADMIN_BOOTSTRAP_*` jika diperlukan. Akun yang sudah ada tidak ditimpa, dan ID akun tidak diubah. Hapus variabel kata sandi bootstrap sesudah digunakan.
4. Jalankan `npm run dev`, buka `/login`, lalu masuk menggunakan akun tersebut.
5. Buka profil → **Pengguna** untuk membuat pemilik lahan, mengatur kepemilikan lahan. Admin membuat akun; registrasi publik tidak tersedia.

`npm run bootstrap:admin` juga menyiapkan indeks unik email/userId, aturan per zona, indeks pencarian, dan TTL pembatas percobaan login. Maksimal 10 percobaan dalam jendela 15 menit per email; respons gagal tidak membedakan akun yang tidak ada dan sandi salah. Login berhasil menghapus hitungan jendela tersebut. Password bcrypt dibatasi hingga 72 byte.

## Akses

- Admin: semua lahan/zona, akun baru, aktivasi/nonaktivasi pengguna selain admin, pemilik lahan, dan uji WhatsApp.
- Pemilik: lahan sendiri, zona dan aturan pada lahan sendiri.
- Nonaktivasi akun diperiksa ulang di database pada setiap permintaan API, termasuk sesi yang masih memiliki JWT.
- Reset kata sandi dan penonaktifan menaikkan `sessionVersion` secara atomik. Sesi lama ditolak setelah reset maupun setelah akun diaktifkan kembali; pengguna harus masuk ulang. Profil/JWT lama tanpa versi diperlakukan sebagai versi 0.
- Penghapusan lahan/zona mengarsipkan data. Riwayat dipertahankan, sementara semua query aktif memeriksa induk yang belum diarsipkan.

Mutation API mewajibkan sesi aktif dan Origin yang cocok; endpoint yang menerima body mewajibkan JSON dengan batas 16 KiB. `AUTH_URL` menetapkan origin publik ketika berada di belakang reverse proxy. Kredensial database/token tidak pernah diberikan ke browser. Respons data akun memakai `private, no-store`. Parameter `page` harus bilangan bulat 1–100.000; nilai tidak valid atau berulang ditolak dengan 422.

## Endpoint

| Endpoint                                                               | Kegunaan                                                                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/api/auth/*`                                                          | Login, logout, sesi, CSRF melalui Auth.js                                                                        |
| `GET /api/workspace`                                                   | Snapshot profil, lahan/zona yang boleh diakses, aturan dan 100 notifikasi terbaru                                |
| `GET/POST /api/farms`                                                  | Daftar berhalaman / tambah lahan                                                                                 |
| `PATCH/DELETE /api/farms/:id`                                          | Ubah / arsipkan lahan                                                                                            |
| `POST /api/farms/:id/zones`                                            | Tambah zona                                                                                                      |
| `PATCH/DELETE /api/zones/:id`                                          | Ubah / arsipkan zona                                                                                             |
| `PUT /api/zones/:id/rule`                                              | Simpan rancangan aturan; status `AWAITING_HARDWARE`                                                              |
| `PUT /api/farms/:id/owner`                                             | Admin mengalihkan lahan kepada pemilik/admin aktif                                                               |
| `GET/POST /api/users`                                                  | Daftar berhalaman / tambah akun oleh admin                                                                       |
| `PATCH /api/users/:id`                                                 | Admin menonaktifkan/mengaktifkan akun selain admin atau mengatur ulang sandi                                     |
| `PUT /api/preferences`                                                 | Simpan preferensi akun sendiri                                                                                   |
| `PATCH /api/notifications/read`                                        | Tandai notifikasi yang boleh diakses, per akun                                                                   |
| `GET /api/reports?farmId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&zoneId=...` | Riwayat tersimpan, maksimal 31 hari dan 10.000 pembacaan / 200 kejadian; persempit tanggal jika batas terlampaui |
| `GET /api/farms/:id/weather`                                           | Cuaca Open-Meteo untuk koordinat lahan, cache MongoDB 10 menit                                                   |
| `GET /api/integrations`                                                | Kesiapan konfigurasi tanpa membocorkan token                                                                     |
| `POST /api/integrations/whatsapp/test`                                 | Uji template resmi; admin, konfirmasi pengguna, UUID idempotensi, batas satu menit                               |

## Cuaca dan WhatsApp

Isi lintang/bujur saat membuat atau mengubah lahan. Cuaca berasal dari model Open-Meteo, menampilkan waktu observasi/pembaruan dan atribusi; ini bukan pembacaan sensor lahan. `WEATHER_ENABLED=false` menonaktifkannya. API gratis Open-Meteo digunakan untuk prototipe nonkomersial; evaluasi ketentuan layanan untuk deployment lain. Provider timeout/konfigurasi yang belum siap ditampilkan sebagai status, bukan angka buatan.

WhatsApp menggunakan host tetap `graph.facebook.com`, versi API eksplisit, template/language dari environment, dan satu nomor penerima uji dari environment. Aktifkan hanya setelah nomor penerima sah dan template tersedia pada akun Meta. Aplikasi tidak mengirim pesan otomatis dalam tahap ini. Tombol uji memerlukan konfirmasi pengguna. `ACCEPTED` berarti permintaan diterima Meta, bukan bukti terkirim/terbaca; webhook delivery belum diimplementasikan. Timeout dicatat `UNKNOWN`; jangan mengulang tanpa memeriksa status Meta. Log uji tersimpan dalam `whatsapp_test_logs`.

## Yang menunggu hardware

Pendaftaran/kredensial perangkat, ingest sensor, kalibrasi, polling/ACK perintah, kendali pompa/katup, scheduler yang mengeksekusi aturan, dan pengaman lokal ESP32. Tombol manual nonaktif; aplikasi tidak membuat kejadian irigasi palsu. Aturan dapat disimpan tetapi tidak pernah dieksekusi. Grafik/CSV hanya memakai data database dan tampil kosong jika belum ada pembacaan.

## Pengujian

Hasil audit dan batas verifikasi terakhir tersedia pada [AUDIT.md](AUDIT.md).

```powershell
npm run check
npm run build
$env:TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/smartfarm_test_e2e'
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

Gunakan database pengujian khusus bernama `smartfarm_test_*`. Suite menyiapkan akun/data pengujian dan membersihkan dokumen yang dibuatnya. Jangan menunjuk database aplikasi utama. Server E2E memakai URI pengujian, `MONGODB_DB` yang sesuai, dan secret acak sendiri. Tutup server dev proyek sebelum membiarkan Playwright menjalankan server dev pengujian pada port 3120; framework mengunci satu server dev per direktori.

Server yang dijalankan suite menetapkan `AUTH_URL` sesuai alamat pengujian dan mematikan provider cuaca/WhatsApp. Bila memakai `PLAYWRIGHT_BASE_URL`, jalankan server pengujian tersebut dengan `WHATSAPP_ENABLED=false` dan `WEATHER_ENABLED=false`; suite tidak mengirim pesan nyata. Pengujian API cuaca langsung dilakukan terpisah.

Untuk menguji build produksi yang sudah berjalan dengan database pengujian yang sama, isi `PLAYWRIGHT_BASE_URL`, misalnya `http://127.0.0.1:3130`; suite tidak menjalankan server kedua. Jangan memakai URL produksi pengguna sungguhan. Browser Chromium/Chrome diperlukan. Hasil berada di `test-results/` dan `playwright-report/`, keduanya diabaikan Git.

Sumber implementasi: dokumentasi Next.js yang terpasang di `node_modules/next/dist/docs/`, [Auth.js Credentials](https://authjs.dev/getting-started/authentication/credentials), [Open-Meteo](https://open-meteo.com/en/docs), dan [Meta WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/).
