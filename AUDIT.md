# Audit integrasi frontend dan backend

Audit 19 November 2026 terhadap implementasi tanpa hardware pada branch `codex/non-iot-backend`, dibandingkan PRD, kontrak API, dan panduan setup. Hasil ini mencakup fitur yang sudah diimplementasikan; penerimaan penuh PRD tetap memerlukan perangkat fisik dan pengujian WhatsApp resmi.

## Temuan yang diperbaiki

| Temuan                                                      | Dampak sebelumnya                                                      | Perbaikan dan bukti                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sesi lama tetap berlaku setelah reset kata sandi            | Pemegang JWT lama masih bisa mengakses API                             | `sessionVersion` disimpan dalam JWT dan diperiksa terhadap profil aktif. Reset menaikkan versi secara atomik. Tes sesi lama ditolak dan login dengan sandi baru berhasil.                                                                  |
| Mengaktifkan kembali akun memulihkan sesi lamanya           | JWT sebelum penonaktifan kembali diterima                              | Penonaktifan juga menaikkan versi sesi; aktivasi tidak mengembalikan versi lama. Tes nonaktif → aktif tetap menolak sesi lama.                                                                                                             |
| Parameter halaman menerima nilai pecahan/tidak terbatas     | Respons daftar tidak konsisten atau menjadi error layanan              | Parameter tunggal `page` divalidasi sebagai integer 1–100.000. Nilai kosong, ganda, negatif, pecahan, dan nonnumerik ditolak.                                                                                                              |
| Simpan pengguna dianggap gagal ketika refresh daftar gagal  | Formulir tetap terisi dan bisa dikirim ulang meski akun sudah dibuat   | Keberhasilan write dipisahkan dari refresh. Formulir dikosongkan, sementara pesan menjelaskan daftar perlu dimuat ulang. Diuji dengan write MongoDB nyata dan kegagalan refresh yang dikendalikan.                                         |
| Respons cuaca tidak valid dianggap kesalahan input pengguna | Pesan error menyalahkan isian atau koneksi database                    | Kegagalan transport/schema provider dinormalisasi dan endpoint mengembalikan 502 dengan kode khusus cuaca.                                                                                                                                 |
| Respons HTML/proxy memunculkan SyntaxError di UI            | Pengguna melihat detail parsing yang tidak membantu                    | Client API menormalkan respons non-JSON/envelope tidak valid menjadi pesan layanan yang jelas.                                                                                                                                             |
| Validasi `instant` masih berjalan pada page privat          | Dev server melaporkan halaman tidak sempat dirender oleh provider akun | Keenam page privat mendeklarasikan `instant = false`; layout saja tidak menonaktifkan validasi implicit tiap page. Diverifikasi melalui log dev dan navigasi seluruh halaman privat. Cache Components dan Partial Prefetching tetap aktif. |

Pemakaian `callbackUrl` pada logout juga diganti dengan `redirectTo`, sesuai deklarasi API Auth.js versi terpasang. Server E2E menetapkan origin sendiri dan mematikan provider eksternal agar kredensial environment aplikasi tidak menyebabkan pesan uji terkirim.

## Hasil verifikasi

Diagnostic produksi terkait `crypto.getRandomValues()` saat prerender juga
diperbaiki: boundary sesi menunggu `connection()` di dalam Suspense sebelum
memanggil Auth.js, sehingga pekerjaan kriptografi hanya terjadi pada request
pengguna. Verifikasi produksi mencakup pemeriksaan log server.

| Pemeriksaan                                        | Hasil                                                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Format, lint tanpa warning, typegen dan TypeScript | Lulus                                                                                                                                    |
| Unit test                                          | 27 lulus                                                                                                                                 |
| Suite browser lengkap                              | 63 lulus dalam satu run; 0 gagal, 0 skip, 0 flaky                                                                                        |
| Responsif                                          | 49 kombinasi: 7 halaman × 320, 375, 768, 1024, 1440, 1920, 2560 px                                                                       |
| Login/logout dan hak akses API                     | Lulus, termasuk akses silang pemilik, pembatasan pekerja, pencabutan sesi dan cookie HttpOnly/SameSite                                   |
| CRUD dan relasi data                               | Lulus untuk persistensi setelah reload, perubahan lahan/zona, arsip, pemindahan pemilik, penugasan/pencabutan akses dan rancangan aturan |
| Notifikasi dan preferensi                          | Lulus untuk status baca per akun dan preferensi setelah reload                                                                           |
| Laporan                                            | Lulus untuk filter akses/tanggal, data DB, unduhan CSV dan tidak terbentuknya perintah perangkat                                         |
| Penanganan request                                 | Lulus untuk JSON tidak valid, media type salah, body terlalu besar, ID salah, Origin palsu dan injeksi kepemilikan                       |
| Development                                        | Login nyata, tambah/baca/reload lahan dan keenam halaman privat lulus; 0 pageerror dan tidak ada diagnostic `instant` pada log server    |
| MongoDB Atlas                                      | Ping, baca profil dan pemeriksaan indeks email unik berhasil; tidak ada perubahan akun/data aplikasi dalam audit ini                     |
| Cuaca aktual                                       | Respons Open-Meteo langsung berhasil dan lolos validasi schema                                                                           |
| Dependency produksi                                | `npm audit --omit=dev` melaporkan 0 advisory                                                                                             |

Dev smoke dijalankan pada snapshot sumber terisolasi menggunakan dependency yang sama karena percobaan menjalankan dev server kedua diblokir oleh pencatatan server workspace yang sudah ada. Log lengkap dipertahankan dan diperiksa setelah server dihentikan. Peringatan direktori workspace/filesystem pada snapshot berasal dari lingkungan pengujian sementara, bukan perubahan konfigurasi aplikasi.

## Dependency development yang masih tercatat

Audit penuh npm masih melaporkan 15 entri pada rantai development ESLint
(6 moderate, 9 high), sama dengan baseline sebelum integrasi. Ini bukan 15 masalah
independen pada aplikasi: beberapa entri merupakan dampak dependency transitif.
Advisory [picomatch GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
sudah berstatus withdrawn pada GitHub sejak 18 November 2026, meskipun masih
muncul pada hasil registry npm saat audit. Advisory
[minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
masih aktif dan menjelaskan amplifikasi pola ketika `optimizationLevel >= 2`.
Pemanggilan typescript-estree yang diperiksa hanya menetapkan `dot: true`;
endpoint aplikasi tidak menerima pola glob dari pengguna.

Dependency tidak dipaksa turun: npm menawarkan `eslint-config-next@14.2.35`
sebagai sebagian jalur perbaikan, sedangkan framework proyek memakai 16.4.6.
Pembaruan transitif lint perlu review kompatibilitas tersendiri, ditargetkan
ditinjau kembali 26 November 2026 atau sebelum deployment publik. Audit ini tidak
menyatakan seluruh dependency development bebas advisory. Dependency produksi
tetap 0 advisory pada pemeriksaan yang dijalankan.

## Batas operasional

- Login, otorisasi, lahan/zona, pengguna, kepemilikan, penugasan, preferensi/status baca, laporan DB, cuaca dan penyimpanan rancangan aturan tersedia.
- Atlas saat audit belum memiliki akun aplikasi: `profiles = 0`, admin aktif = 0. Jalankan `npm run bootstrap:admin` untuk menentukan identitas dan kata sandi admin pertama. Audit tidak membuat akun admin aplikasi secara otomatis.
- Sensor, heartbeat, ingest, ACK, pompa/katup, scheduler yang mengeksekusi aturan dan fail-safe ESP32 tetap menunggu hardware. Tidak ada perintah perangkat yang dikirim dalam pengujian.
- WhatsApp diuji untuk validasi konfigurasi dan penolakan aman saat dimatikan. Tidak ada pesan nyata dikirim; pengiriman dan delivery webhook belum dinyatakan lulus. Token, pengirim, template dan penerima uji sah tetap diperlukan.
- Snapshot notifikasi memuat 100 entri terbaru. UI penugasan massal saat ini dibatasi sampai 100 pengguna; API penugasan menerima maksimal 50 pekerja per zona. Peningkatan kapasitas UI perlu dikerjakan bila batas ini akan dilampaui.
- Pengujian browser memakai Chrome. Safari/mobile native, deployment publik, dan pemulihan saat gangguan jaringan/layanan sesungguhnya belum dinyatakan teruji.

Petunjuk menjalankan aplikasi dan suite berada di [BACKEND.md](BACKEND.md). Data uji dipisahkan ke database MongoDB lokal khusus; provider pesan dimatikan selama suite.
