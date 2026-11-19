# Audit UI menyeluruh

Audit 19 November 2026 pada `codex/ui-spacing-polish` mencakup seluruh route UI yang tersedia, komponen bersama, dialog, serta kondisi data dan layanan. Gaya visual SmartFarm dipertahankan.

## Cakupan

| Area           | Kondisi yang diperiksa                                                                               | Perbaikan                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Login          | Form, bantuan, tampil/sembunyi kata sandi, kredensial salah, layar pendek                            | Label dan catatan lebih terbaca, input ponsel 16 px, pesan error jelas, tombol bantuan mudah disentuh                              |
| Dashboard      | Data tersedia/kosong, perangkat offline, nama panjang, cuaca loading/gagal/berhasil/tanpa koordinat  | Susunan panel konsisten, kartu metrik satu kolom pada ponsel, panel cuaca terstruktur, tinggi visual air mengikuti angka pembacaan |
| Lahan & sensor | Daftar, pencarian, hasil kosong, zona kosong, pemilihan lahan, tujuh dialog lahan/zona/perangkat     | Kartu mengikuti ruang dan isi, aksi 44 px, teks panjang membungkus, formulir dan tombol dialog tetap terjangkau                    |
| Irigasi        | Manual/otomatis, belum ada zona, rancangan tersimpan, peran pekerja hanya baca                       | Tipografi dan grup form konsisten; status aktif terlihat; kontrol fisik tetap nonaktif                                             |
| Analisis       | Filter tanggal/zona, loading, error, data kosong, satu/banyak titik, CSV                             | Jarak filter/grafik/unduhan jelas; error terpisah; grafik terukur dan tidak menggambarkan tren palsu                               |
| Notifikasi     | Daftar, filter, belum dibaca/kosong, preferensi, integrasi belum siap                                | Panel terpisah, indikator aktif jelas, waktu WIB, sakelar memiliki area interaksi 48×44 px                                         |
| Pengguna       | Admin/pemilik/pekerja, daftar loading/gagal/kosong, tambah/reset, penugasan, kepemilikan, pagination | Status daftar dibedakan dan bisa dicoba lagi; checkbox dekat nama; daftar dan form tersusun responsif                              |
| Bersama        | Sidebar, navigasi ponsel, profil, toast, loading sesi/workspace, kegagalan request/render, 404       | Teks informasi minimal 12 px, target aksi utama 44 px, error diberi penanda jelas, halaman pemulihan dan fokus modal konsisten     |

Dialog diperiksa: bantuan masuk, profil, tambah/ubah/hapus lahan, tambah/ubah/hapus zona, serta rincian perangkat. Header dialog tetap terlihat ketika isi digulir; tombol simpan/arsip dipisahkan ke footer. Jika simpan atau arsip gagal, pesan tetap terlihat dalam dialog aktif dan isian dipertahankan.

## Verifikasi

- `npm run check`: lulus untuk format, lint tanpa warning, TypeScript dan 35 unit test.
- `npm run build`: lulus; Cache Components dan Partial Prefetching tetap aktif.
- Suite Playwright: 93 lulus dalam satu run, tanpa gagal/skip/flaky. Cakupan termasuk ketiga peran, 9 dialog, nama panjang, kondisi kosong/loading/error, pemulihan error, serta kegagalan simpan/arsip.
- Pemeriksaan tambahan: 126 kombinasi = 6 halaman privat × 3 peran × 7 lebar (320, 375, 768, 1024, 1440, 1920, 2560 px). Pengukuran mencakup overflow, area kontrol dan error JavaScript; screenshot tiap halaman diperiksa pada ponsel dan desktop.
- Dialog panjang diuji pada viewport 320×480 dan 844×390, termasuk header/tombol yang tetap terjangkau setelah scroll. Escape mengembalikan fokus ke pemicu.

Suite Playwright menggunakan database lokal `smartfarm_test_*`. Kondisi kosong, data panjang, loading dan kegagalan layanan menggunakan respons pengujian yang dikendalikan di browser. Pemeriksaan tambahan dengan dataset Atlas membaca akun/data dummy yang sudah ada; tidak menjalankan mutasi lahan atau mengirim pesan.

## Menjalankan ulang

Gunakan perintah dan database pengujian khusus pada [BACKEND.md](BACKEND.md). Tes UI tambahan berada di `tests/e2e/ui-audit.spec.ts`, dengan helper login yang dipakai bersama suite aplikasi. Hasil otomatis tersimpan pada `playwright-report/` dan `test-results/`.

Screenshot pemeriksaan lokal berada di `tasks/all-ui-*.png`; hasil pengukuran berada di `tasks/all-ui-results.json`. Folder `tasks/` diabaikan Git. Ketentuan styling dan lokasi komponen tersedia pada [ARCHITECTURE.md](ARCHITECTURE.md).

Verifikasi dilakukan pada Chromium/Chrome. Ini tidak menyatakan sertifikasi aksesibilitas penuh atau pengujian pada perangkat Safari/iOS fisik. Pengoperasian hardware IoT dan pengiriman WhatsApp nyata tetap mengikuti batas integrasi backend.
