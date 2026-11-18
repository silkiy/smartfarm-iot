# SmartFarm IoT

Website monitoring dan otomatisasi irigasi berbasis Next.js, MongoDB Atlas, dan ESP32.

## Frontend preview

The six Stitch screens are implemented as native Next.js routes:

| Route         | Screen                                                           |
| ------------- | ---------------------------------------------------------------- |
| `/login`      | Login and role preview                                           |
| `/dashboard`  | Farm overview, soil moisture, water level and actuator state     |
| `/irigasi`    | Manual irrigation simulation and automatic-rule settings         |
| `/analisis`   | Sensor charts, date/zone filters, CSV download and print layout  |
| `/notifikasi` | Alerts, unread filters, preferences and WhatsApp message preview |
| `/lahan`      | Farm and zone create/edit/delete flows and device information    |

The root route redirects to `/dashboard`. All preview routes are public and use
deterministic sample data. Login only demonstrates the form flow; it does not
authenticate, retain a password or call the existing Auth.js API. The role selector
changes UI availability only and is not an authorization control.

Demo state is shared during client navigation and resets on a full reload. Farm
and zone edits, notification preferences and automatic-rule settings remain local
to that session. The irrigation countdown is capped at 15 seconds and continues
while navigating between preview pages; it never sends a physical device command.
WhatsApp preview never sends a message. CSV exports are labelled as sample data;
PDF output is available through the browser's print/save-as-PDF flow.

The layout uses desktop sidebar navigation and mobile bottom navigation, with
locally hosted Plus Jakarta Sans and photographs from the supplied Stitch export.
Font licensing is included at `src/app/fonts/OFL.txt`. The existing backend,
database connection and authentication implementation remain separate from this
frontend preview and will be integrated in a subsequent change.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local`, lalu isi konfigurasi server-only:

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=generate-a-long-random-secret
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

## Authentication

Authentication uses Auth.js Credentials with bcrypt password hashes. To create the first
administrator, set the `ADMIN_BOOTSTRAP_*` variables in `.env.local` and run:

```bash
npm run bootstrap:admin
```

Remove or clear the bootstrap password after the command succeeds. The login endpoints
are served by `/api/auth/*`; profile role and resource authorization are checked server-side.

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
