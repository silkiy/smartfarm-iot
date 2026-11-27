# NOTES — 27 Nov 2026

**Selesai:** CP1; **T3** register + bcryptjs cost 12 (role USER server, email lowercase, dup 409, no passwordHash, rate-limit, no-store); **T4** Auth.js v5 `next-auth@5.0.0-beta.32` Credentials + JWT + `signInSchema`, generic failure, `next-auth.d.ts`, `/login`, server `@/auth` NOT in client (use `next-auth/react`); **T5** Next16 `proxy.ts` + `app-error` + `auth-guard`.
**Verifikasi:** lint, tsc, **46/46**, build, audit 0. Runtime: `/dashboard` no-session→307 `/login`. Tidak menyentuh DB prod; test pakai mock.
**CP2 (T3→T5):** teknis lulus; **end-to-end + review manusia belum**; manual DB checks menunggu DB scratch.
**Conflicts dilaporkan:** 403 (T5) vs 404-not-leak (§11.3, pakai 403 sesuai T5); Credentials vs Auth.js modern-rekomendasi; rate-limit in-memory vs ask-first + Vercel multi-instance; ordering T3→C2 vs Task15 `/dashboard` (placeholder); CSP no-nonce; docs/PRD hilang→PANDUAN; user-Figma `/dashboard` konflik token ditunda.
**Masih terbuka §6.1:** D1,D2,D3,D5,D6,D8,D9,D10. **D4=bcryptjs, D11=mock.**
**Dependency baru:** `bcryptjs`, `next-auth`. 
**Berikutnya:** CP2 review; Figma `/dashboard`; Task 6 (+crypto, unique deviceId/macAddress, one-time api key); `AppError→HTTP` mapping ke API; `/dashboard` placeholder → T15.
