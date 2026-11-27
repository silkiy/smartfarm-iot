# Implementasi Auth Slice 1 — SmartFarm Hidroponik

Slice 1 membangun seluruh pondasi autentikasi: credential login via Auth.js v5 + JWT, bcrypt password hashing, sessionVersion revocation, dan bootstrap admin script. Pendekatan secara keseluruhan solid — bcrypt 12 rounds, Zod validation di boundary, sessionVersion per-request DB check, dan error message yang sudah generic. Namun ada beberapa celah yang harus ditutup sebelum production: tidak ada rate limiting di endpoint login, session callback melakukan DB round-trip di setiap request (termasuk aset statis), satu potensi timing difference antara "user tidak ada" dan "password salah", dan tidak ada `callbackUrl` validation yang bisa membuka open redirect.

**Watch for:** Rate limiting login endpoint tidak ada sama sekali (confirmed) — ini yang paling kritis sebelum go-live. Session callback query DB di setiap request berpotensi jadi bottleneck dan DoS amplifier (confirmed). Timing parity antara "user not found" vs "password wrong" tidak terjamin (likely). Open redirect via `callbackUrl` perlu diverifikasi apakah Auth.js v5 sudah menangani (possible).

**Verdict**: NEEDS_CHANGES

---

## High-level view

Tidak ada mekanisme rate limiting atau brute-force throttling di path `/api/auth/[...nextauth]` maupun di `authorize()` callback. Meski ada TTL index `auth_attempts` di MongoDB yang sudah disiapkan, tidak ada kode yang menulis atau membaca collection tersebut. Sebuah bot bisa mencoba credential tak terbatas tanpa hambatan.

Session callback (`session()` di `src/auth.ts`) melakukan `findOne` ke MongoDB di setiap request yang membutuhkan session — termasuk setiap Server Component, Server Action, dan middleware call. Untuk app dengan banyak widget/komponen per halaman yang masing-masing memanggil `auth()`, ini bisa menjadi N DB query per page load.

Saat user tidak ditemukan di database, `authorize()` langsung `return null` tanpa memanggil `verifyPassword`. Waktu respons untuk "user tidak ada" adalah beberapa mikrodetik; untuk "password salah" adalah ~100ms bcrypt. Seorang attacker bisa membedakan keduanya via timing, mengonfirmasi apakah sebuah username terdaftar.

`callbackUrl` yang dikirim oleh `signIn("credentials", { callbackUrl: "..." })` di client tidak divalidasi secara eksplisit di kode ini. Auth.js v5 memang melakukan same-origin check secara internal, tetapi ini perlu dikonfirmasi karena versi beta masih berubah-ubah.

`ProfileDocument.sessionVersion` bertipe `number | undefined` (optional field di interface). Jika dokumen lama tidak memiliki field ini, `profile.sessionVersion ?? 0` di callback cocok dengan `token.sessionVersion = 0` yang diset saat login — artinya user dari dokumen lama yang tidak punya sessionVersion akan selalu dianggap valid, tidak bisa direvoke kecuali field di-set secara eksplisit. Create-admin script sudah set `sessionVersion: 0` dengan benar, tapi skema DB tidak memaksa field ini.

Dashboard page (`src/app/dashboard/page.tsx`) melakukan auth check sendiri dengan `auth()` + redirect, sementara `(app)/layout.tsx` sudah melakukan hal yang sama. Ini double-check yang tidak berbahaya tapi membuat dua DB round-trip per page load di halaman yang berada di luar route group `(app)`.

---

<details>
<summary>Issues (6)</summary>

1. **Tidak ada rate limiting di login endpoint** — `/api/auth/[...nextauth]` bisa dibombardir tanpa batas. TTL index `auth_attempts` sudah ada di DB tapi tidak ada kode yang menggunakannya. Implementasikan middleware atau in-process counter yang menulis ke `auth_attempts` dan reject setelah N percobaan gagal per IP atau per username dalam window waktu tertentu.

2. **Timing oracle: "user tidak ada" vs "password salah"** — `authorize()` return null langsung saat `findOne` gagal tanpa melakukan `verifyPassword`. Tambahkan dummy bcrypt compare (`bcrypt.compare(password, DUMMY_HASH)`) di path "user not found" agar response time homogen.

3. **Session callback query DB di setiap request** — `session()` callback melakukan `findOne` per-request termasuk rendering Server Component. Di bawah load, ini akan menjadi bottleneck. Pertimbangkan cache singkat (mis. 60 detik per userId via in-memory LRU atau Redis) dengan cache-bust saat sessionVersion berubah, atau pindahkan validasi ke middleware edge yang lebih ringan.

4. **`sessionVersion` bisa bypass untuk dokumen tanpa field ini** — `profile.sessionVersion ?? 0` default ke 0, sama dengan `token.sessionVersion` default saat login. Dokumen profil yang tidak punya field ini tidak bisa direvoke. Tambahkan `sessionVersion: 0` wajib di skema atau gunakan `profile.sessionVersion == null ? throwError() : ...` untuk memaksa field selalu ada.

5. **Open redirect via `callbackUrl` perlu dikonfirmasi** — Auth.js v5 beta memiliki riwayat perubahan pada validasi `callbackUrl`. Konfirmasi bahwa versi `^5.0.0-beta.32` yang dipakai melakukan same-origin enforcement, atau tambahkan validasi eksplisit sebelum `router.push()` di `login-form.tsx` jika URL berasal dari query param.

6. **Double auth check di `DashboardPage`** — `src/app/dashboard/page.tsx` memanggil `auth()` + redirect meski sudah dilindungi oleh `(app)/layout.tsx`. Saat `src/app/dashboard/` dipindah masuk ke dalam route group `(app)/dashboard/` di slice berikutnya, hapus check duplikat ini untuk menghilangkan DB round-trip ganda.

</details>

---

<details>
<summary>Details</summary>

### Tidak ada rate limiting — collection `auth_attempts` sudah disiapkan tapi kosong

Index TTL di collection `auth_attempts` dibuat di `src/server/db/indexes.ts`, yang menunjukkan ada niat untuk implementasi rate limiting. Tapi tidak ada kode di `authorize()` yang membaca atau menulis collection ini. Endpoint `/api/auth/[...nextauth]` bisa dipukul secara paralel tanpa throttling apapun. Untuk app pertanian yang mungkin di-deploy ke jaringan lokal dengan one admin account, ini berarti satu password lemah bisa di-brute-force dalam menit.

Pola yang dibutuhkan: sebelum `verifyPassword`, query `auth_attempts` untuk count IP/username dalam window, return null jika exceeded, dan tulis attempt baru setelahnya (baik success maupun failure — rate limit by username, bukan hanya by failure).

### Timing attack: `authorize()` fast-path untuk user tidak ada

```typescript
// src/auth.ts — authorize()
const profile = await db.collection(...).findOne({ username, isActive: true });
if (!profile) return null;  // ← return langsung, tanpa bcrypt
const valid = await verifyPassword(...);
```

Waktu `findOne` yang miss (user tidak ada): <1ms. Waktu `verifyPassword` bcrypt 12 rounds: ~100-200ms. Perbedaan ini terukur bahkan dari jaringan eksternal. Tambahkan dummy compare:

```typescript
const DUMMY_HASH = "$2a$12$..."; // pre-computed placeholder
if (!profile) {
  await bcrypt.compare(parsed.data.password, DUMMY_HASH); // constant-time dummy
  return null;
}
```

### Session callback: DB hit per-request

Setiap kali `auth()` dipanggil di Server Component atau Server Action, `session()` callback berjalan dan melakukan `db.collection("profiles").findOne({ userId: token.id })`. Untuk halaman dashboard yang complex dengan banyak Server Components paralel, ini bisa berarti 3-5 DB queries per page load hanya untuk session validation.

Revocation via sessionVersion adalah fitur penting — tidak disarankan dihapus. Tapi bisa dibatasi dengan: (a) in-memory cache dengan TTL pendek yang di-bust saat sessionVersion increment, atau (b) encode sessionVersion di JWT dan hanya verify ke DB saat token mau expire atau ada flag khusus. Auth.js v5 mendukung pola "update token" yang bisa dimanfaatkan.

### `sessionVersion` optional field — bypass risk

```typescript
// src/domain/models.ts
export interface ProfileDocument extends BaseDocument {
  sessionVersion?: number; // ← optional
}
```

```typescript
// src/auth.ts — session callback
if ((profile.sessionVersion ?? 0) !== token.sessionVersion) { ... }
```

Jika ada dokumen profil (mis. seeding manual, migrasi) yang tidak punya `sessionVersion`, nilai `undefined ?? 0` = `0` = `token.sessionVersion` default → session valid selamanya. Create-admin script sudah benar, tapi protection ini bergantung pada semua code path yang membuat profil ikut set field. Jadikan wajib di interface atau tambahkan DB-level default.

### `callbackUrl` di Auth.js v5 beta.32 — belum dikonfirmasi

`LoginForm` saat ini hardcode `router.push("/dashboard")` dan tidak membaca `callbackUrl` dari query param, sehingga tidak ada open redirect langsung di kode login. Namun `signIn("credentials", options)` dari next-auth client dapat menerima `callbackUrl` di `options` — Auth.js v5 beta memiliki riwayat perubahan pada validasi field ini. Perlu dikonfirmasi bahwa beta.32 memberlakukan same-origin enforcement, terutama sebelum ada fitur "redirect setelah login" yang membaca URL dari query param.

### `src/app/dashboard/page.tsx` di luar route group `(app)`

Halaman ini berada di `src/app/dashboard/` bukan di `src/app/(app)/dashboard/`. Layout `(app)/layout.tsx` tidak melindungi halaman ini — `DashboardPage` mengguard dirinya sendiri. Dua pola guard yang berbeda menciptakan risiko: developer yang menambahkan halaman baru di dalam `(app)/` mengandalkan layout guard, sedangkan developer yang menambah di luar `app/` harus ingat guard sendiri. Satu halaman yang luput membuat route terbuka.

</details>

---

<details>
<summary>File map</summary>

| File                                      | Peran dalam Slice 1                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/auth.ts`                             | NextAuth config, Credentials provider, JWT + session callbacks, sessionVersion check |
| `src/domain/auth.ts`                      | Zod schema validasi input login                                                      |
| `src/domain/models.ts`                    | TypeScript interface `ProfileDocument` termasuk `sessionVersion` optional field      |
| `src/server/auth/passwords.ts`            | bcrypt hash (12 rounds) dan verify                                                   |
| `src/server/auth/current-user.ts`         | Server-side session helper                                                           |
| `src/server/db/mongodb.ts`                | MongoDB singleton connection                                                         |
| `src/server/db/indexes.ts`                | DB indexes termasuk TTL index `auth_attempts` yang belum dipakai                     |
| `src/app/api/auth/[...nextauth]/route.ts` | Route handler Auth.js, runtime nodejs                                                |
| `src/app/login/page.tsx`                  | Server Component login page dengan auth redirect                                     |
| `src/features/auth/login-form.tsx`        | Client Component form login                                                          |
| `src/app/(app)/layout.tsx`                | App shell layout dengan auth guard                                                   |
| `src/app/dashboard/page.tsx`              | Dashboard page dengan auth check duplikat di luar route group                        |
| `scripts/create-admin.ts`                 | Bootstrap admin script satu kali pakai                                               |
| `src/types/next-auth.d.ts`                | Type augmentation untuk Session, User, JWT                                           |

Full diff tidak tersedia (review manual); semua file ini adalah bagian dari Slice 1 initial implementation.

</details>
