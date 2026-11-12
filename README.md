# SmartFarm IoT

Website monitoring dan otomatisasi irigasi berbasis Next.js, MongoDB Atlas, dan ESP32.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local`, lalu isi konfigurasi server-only:

```env
MONGODB_URI=mongodb+srv://...
```

Nama database diambil dari bagian path pada URI (`/.../smartfarm`). `MONGODB_DB`
tetap dapat digunakan sebagai override opsional jika diperlukan. Jangan gunakan prefix
`NEXT_PUBLIC_` untuk credential database. File `.env*` di-ignore oleh Git dan secret
tidak boleh dimasukkan ke repository.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database API foundation

Endpoint health database:

```text
GET /api/health/db
```

Response berhasil:

```json
{
  "status": "ok",
  "service": "mongodb"
}
```

Jika konfigurasi belum tersedia atau MongoDB tidak dapat dijangkau, endpoint mengembalikan
HTTP `503` dengan error code terstruktur tanpa membocorkan connection string atau detail
internal.

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Route Handler mengikuti konvensi App Router Next.js:

- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://nextjs.org/docs/app/guides/environment-variables
