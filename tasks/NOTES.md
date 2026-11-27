# NOTES — 27 Nov 2026

**Selesai:** Task 1 (Next.js 16.4.6 + TS strict + Tailwind v4 + Vitest 4.1.12) dan Task 2 (env Zod, `getDb()` singleton, `scripts/ensure-indexes.ts`). Verifikasi: lint, tsc, 12 test, build lulus; 8 index terpasang di Atlas (idempoten).

**Berjalan:** Berhenti di **Checkpoint 1** — menunggu review manusia sebelum Task 3.

**Keputusan:** D4 = `bcryptjs` cost ≥ 12; D11 = unit test + mock (dicatat di `plan.md`).

**Deviasi yang perlu diketahui:** `vitest` dipin ke ^4.1.12 (v5 menolak Node 25 di mesin ini), `eslint` ke ^10 (v9 EOL), `@types/node` ^24 (syarat peer vitest). `.env` lokal diperbaiki (AUTH_SECRET 64 char, MONGODB_DB_NAME). `docs/PRD.md` belum ada di repo.

**Berikutnya:** Task 3 — register + bcryptjs (butuh `npm i bcryptjs`), Task 4 login Auth.js v5 (`next-auth@5 beta`), Task 5 `proxy.ts` + helper otorisasi.
