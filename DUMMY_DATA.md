# Data dummy aplikasi

Dataset pengembangan berisi **120 dokumen: 10 pada setiap kategori** berikut.

| Kategori          | Collection MongoDB  | Jumlah |
| ----------------- | ------------------- | ------ |
| Akun pengguna     | `profiles`          | 10     |
| Lahan             | `farms`             | 10     |
| Zona/petak        | `zones`             | 10     |
| Perangkat         | `devices`           | 10     |
| Sensor            | `sensors`           | 10     |
| Riwayat pembacaan | `sensor_readings`   | 10     |
| Rancangan aturan  | `irrigation_rules`  | 10     |
| Contoh perintah   | `device_commands`   | 10     |
| Riwayat irigasi   | `irrigation_events` | 10     |
| Notifikasi        | `alerts`            | 10     |
| Log notifikasi    | `notification_logs` | 10     |
| Contoh cuaca      | `weather_records`   | 10     |

Relasi lahan, zona, pemilik, pekerja, perangkat dan riwayat memakai ID yang saling terhubung. Jumlah ini menghitung dokumen dengan `seedBatch: "smartfarm-dummy-v1"`; data lain yang sudah ada tetap dipertahankan. Collection teknis seperti `auth_attempts` bukan kategori dummy.

## Akun

| Peran            | Email                                              | Jumlah |
| ---------------- | -------------------------------------------------- | ------ |
| Admin            | `silki@dummy.com`                                  | 1      |
| Pemilik lahan    | `pemilik01@dummy.com` sampai `pemilik05@dummy.com` | 5      |
| Pekerja lapangan | `pekerja01@dummy.com` sampai `pekerja04@dummy.com` | 4      |

Pada pembuatan awal, seluruh akun memakai kata sandi yang diberikan melalui `DUMMY_SEED_PASSWORD`. Kata sandi disimpan sebagai hash bcrypt; nilainya tidak ditanamkan dalam kode. Kebijakan login, pembuatan akun, bootstrap admin dan reset kata sandi sama: minimal **9 karakter**, maksimal **72 byte UTF-8**.

Admin melihat seluruh lahan. Setiap pemilik memiliki dua lahan; pekerja hanya melihat petak yang ditugaskan kepadanya. Akun dummy tetap memakai login dan pemeriksaan hak akses yang sama dengan akun lainnya.

## Menjalankan seeder

Seeder memakai `MONGODB_URI` dan, jika disetel, `MONGODB_DB` dari environment aplikasi. Pastikan keduanya menunjuk database pengembangan yang dimaksud. Untuk membuat dataset pada lingkungan lain dengan PowerShell 7:

```powershell
$env:DUMMY_ADMIN_EMAIL = 'silki@dummy.com'
$env:DUMMY_SEED_PASSWORD = Read-Host 'Kata sandi dummy, minimal 9 karakter' -MaskInput
try {
    npm run seed:dummy
} finally {
    Remove-Item Env:DUMMY_ADMIN_EMAIL, Env:DUMMY_SEED_PASSWORD
}
```

ID seed tetap, sehingga menjalankan ulang tidak menggandakan data. Dokumen yang sudah ada dipertahankan, termasuk perubahan lahan dan akun dummy selain admin. Jika email admin sudah ada, ID akunnya dipertahankan dan akun tersebut disesuaikan menjadi admin aktif dengan kata sandi yang diberikan; perubahan kredensial/peran mencabut sesi sebelumnya. Menjalankan ulang dengan kredensial admin yang sama tidak mencabut sesi tersebut. Email/ID dummy yang berbenturan dengan data lain menghentikan proses. Jika proses terputus, jalankan ulang untuk melengkapi dataset.

## Penandaan dan batas penggunaan

Semua dokumen seed memiliki `isDemo: true`, `seedBatch`, dan `seedKey`. Banner lahan dummy, keterangan laporan, riwayat irigasi dan baris CSV menampilkan label DUMMY. Riwayat pembacaan ditempatkan pada tanggal seeder dijalankan; pilih rentang tanggal tersebut ketika membuka laporan di hari lain.

Perangkat berstatus `DISABLED`, sensor nonaktif, dan aturan tidak diaktifkan. Contoh perintah, kejadian irigasi dan log pengiriman berstatus `FAILED` agar tidak masuk antrean eksekusi atau menyatakan aktivitas fisik/pengiriman berhasil. Seeder tidak memanggil perangkat atau layanan pesan.

Contoh cuaca berprovider `DUMMY` dikecualikan dari cache endpoint cuaca. Cuaca pada dashboard tetap berasal dari Open-Meteo saat integrasi diaktifkan. Data dummy tidak menjadi bukti penerimaan sensor, irigasi fisik, atau pengiriman WhatsApp.
