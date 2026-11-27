# NOTES — 27 Nov 2026

**Selesai:** CP1; T3; T4; T5; CP2 teknis **+ end-to-end 20/20** (`scripts/verify-checkpoint2.mts`, scratch `cp2_scratch`, dibersihkan, bukan prod).
**Build fix:** `@tailwindcss/turbopack` custom loader → **`@tailwindcss/postcss`** + `postcss.config.mjs`; CSS diverifikasi; `npm run build`/lint/tsc/test/audit lulus; `npm ci` Windows-EPERM + `npm install`.
**CP2 script robust:** timeout Mongo + spawn `process.execPath node_modules/next/dist/bin/next` (tanpa `npx`) + langkah log.
**Verifikasi:** lint, tsc, **46/46**, build, audit 0. Scratch dropped.
**CP2 (T3→T5):** teknis + e2e lulus; **review manusia + centang menunggu Anda**; TIDAK lanjut Task 6 (§18).
**Conflicts:** 403 vs 404; Credentials vs Auth.js-modern; rate-limit in-memory + ask-first + Vercel; CSP no-nonce; `AppError→HTTP`; `docs/PRD.md`→PANDUAN; ordering vs Task15; Figma `/dashboard` ditunda; `/dashboard` placeholder; Tailwind turbopack vs postcss (dipilih postcss).
**Masih terbuka §6.1:** D1,D2,D3,D5,D6,D8,D9,D10. D4=bcryptjs, D11=mock.
**Berikutnya:** review CP2; CP2; Task 6; `AppError→HTTP`; `/dashboard`→T15; CSP nonce.