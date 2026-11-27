# Checkpoint 2 — status & verifikasi end-to-end reproducible

## Status: pemeriksaan teknis lulus, Checkpoint 2 **belum** selesai

**Yang sudah (autonomous, nyata dijalankan):**
- `npm ci` — berhasil di **isolasi**; di pool Windows ini **EPERM unlink `lightningcss.win32-x64-msvc.node`** (proses `node` aktif / antivirus); `node_modules` dipulihkan `npm install`.
- `npm run lint`, `npx tsc --noEmit`, `npm test` (**46/46**), `npm run build`, `npm audit --omit=dev` (0).
- Runtime (`next start`, prod): `/register`,`/login` 200; `POST /api/auth/register` invalid→400; `/dashboard` no-session→307 `/login`; `/dashboard/admin`→307; `/login`+`/register` logged-in→`/dashboard` **kode**; session callback `id`+`role`.
- Unit/integration test (mock `@/auth`, `@/lib/db`, `mongodb`): register, password, rate-limit, authenticate, **session `id`/`role`**, RBAC, NoSQL-injection, 401/403/404, **tidak ada `passwordHash`/`apiKeyHash`**.
- Tidak ada secret di-commit; `.env` tidak di-stage; `docs/PRD.md` tidak ada→`PANDUAN.md`.

**Yang belum bisa (maka Checkpoint 2 belum tuntas):**
- **End-to-end nyata `/register`→`/login`→`/dashboard` dengan sesi** + cek manual dokumen `users` + incognito + **review manusia**.
- **Tidak ada scratch-MongoDB**: tidak ada `mongod`/`mongosh`, tidak ada `MONGODB_TEST_URI`, **tidak boleh terhadap produksi**, **`mongodb-memory-server` tidak diizinkan** (devDependency baru + **D11=mock**).
- **Browser** (tidak ada Chrome DevTools MCP): CSP/a11y/cookie sesi tidak bisa dilihat.
- Konflik/keputusan terbuka (lihat `NOTES.md`, `tasks/plan.md`).

## Verifikasi end-to-end reproducible aman (manusia, scratch-DB, BUKAN produksi)

Prasyarat: **scratch** MongoDB (lokal `mongod`, atau database test terpisah + kredensial terpisah + `MONGODB_TEST_URI` + `MONGODB_TEST_DB`, **bukan** `smartfarm`/produksi). Catat hasil di `tasks/CHECKPOINT2.md`.

```powershell
# 1) env scratch (JANGAN .env produksi). Contoh lokal mongod:
#    $env:MONGODB_URI='mongodb://127.0.0.1:27017'
#    $env:MONGODB_DB_NAME='cp2_scratch'
#    $env:AUTH_SECRET='<32+ acak>'; $env:AUTH_URL='http://localhost:3000'
# 2) index pada scratch:
npx tsx scripts/ensure-indexes.ts
# 3) app:
npx next start -p 3000
```

```powershell
$base='http://localhost:3000'
$jar=Join-Path $env:TEMP 'opencode\cp2-cookies.txt'; if(Test-Path $jar){Remove-Item $jar}
$email="cp2.$(Get-Random)@example.test"; $pw='rahasia-kuat-123'; $name='CP2 Test'

# register (scratch); role 'ADMIN' dari klien harus DIABAIKAN -> USER
$regBody=Join-Path $env:TEMP 'opencode\cp2-reg.json'; [IO.File]::WriteAllText($regBody,(@{name=$name;email=$email;password=$pw;role='ADMIN'}|ConvertTo-Json))
curl.exe -sS -w "`nreg=%{http_code}`n" -X POST "$base/api/auth/register" -H 'content-type: application/json' --data-binary ("@"+$regBody)

# CSRF + credentials login (capture cookie jar)
$csrf=(curl.exe -sS "$base/api/auth/csrf" -c $jar | ConvertFrom-Json).csrfToken
$loginBody=Join-Path $env:TEMP 'opencode\cp2-login.json'; [IO.File]::WriteAllText($loginBody,(@{email=$email;password=$pw;csrfToken=$csrf;redirect='false'}|ConvertTo-Json))
curl.exe -sS -o NUL -w "login=%{http_code}`n" -X POST "$base/api/auth/callback/credentials" -H 'content-type: application/x-www-form-urlencoded' -c $jar -b $jar --data-binary ("@"+$loginBody)
# (Auth.js Credentials biasanya form-urlencoded; email+password+csrfToken; redirectTo opsional)

# session
curl.exe -sS "$base/api/auth/session" -b $jar -c $jar
# /dashboard dengan sesi -> 200 ; tanpa -> 307 /login ; /login dengan sesi -> 307 /dashboard
curl.exe -sS -o NUL -w "dash_auth=%{http_code}`n" "$base/dashboard" -b $jar
curl.exe -sS -o NUL -w "dash_anon=%{http_code} -> %{redirect_url}`n" "$base/dashboard"
curl.exe -sS -o NUL -w "login_auth=%{http_code} -> %{redirect_url}`n" "$base/login" -b $jar

# cek dokumen `users` scratch TANPA passwordHash (hanya scratch), mis. mongosh:
# db.users.find({},{passwordHash:0})  -- assert passwordHash TERSIMPAN bcrypt; role=='USER'; email lowercase; createdAt
```

## Hasil yang diharapkan
- register → **201**, `ok:true`, `role:'USER'`, **tidak ada `passwordHash`**; `role` klien **diabaikan**; email duplikat → **409**.
- login → cookie sesi; `GET /api/auth/session` → `user.id`,`user.role`; login gagal → **generik**.
- `/dashboard` dengan sesi **200**; anon → **307 `/login`**; `/login` dengan sesi → **307 `/dashboard`**; `/dashboard/admin` bukan admin → `/dashboard`/403.
- `users`: `passwordHash` **tersimpan bcrypt `$2…$12$`, tidak pernah dikembalikan**.
- scratch-DB **dibersihkan**; **tidak ada produksi**.

## Konflik yang memerlukan keputusan manusia
403 vs 404; Credentials vs Auth.js modern; rate-limiting in-memory vs ask-first + Vercel; CSP nonce; `AppError→HTTP`; `docs/PRD.md`; ordering T3→CP2 vs Task15/`/dashboard`; Figma token; **CP2 itu sendiri**.
