# NOTES — 27 Nov 2026

**Selesai:** T1, T2; **Checkpoint 1 ditutup** (`npm ci`, lint, tsc, test, build, audit lulus; Atlas + index; review user).
**Berjalan:** branch `fix/review-findings`. Perbaikan: kontras `/60`→`/70`, `.finally` close, hapus `as`, **security headers + CORS** di `next.config.ts`. Verifikasi ulang lulus.
**Keputusan user:** SEDANG-2 + RENDAH-5 diizinkan; SEDANG-3=A (jangan expose landing produksi sampai T3–T5); **D4=bcryptjs**, **D11=unit+mock**; `docs/PRD.md` hilang → **pakai `PANDUAN.md`** (tidak membuat PRD.md); Checkpoint 1 disetujui bila siap; proceed **Phase 1 step by step**.
**Standar:** CSP no-nonce karena `cacheComponents`+PPR (nonce⇒dynamic); HSTS dari Vercel; CORS bukan auth, tidak pernah `*`, conditional allowlist.
**Masih terbuka §6.1:** D1, D2, D3, D5, D6, D8, D9, D10.
**Berikutnya:** **Task 3** register + bcryptjs; T4 Auth.js v5; T5 `proxy.ts` + helper otorisasi (+ revisit CSP nonce/SRI); Checkpoint 2.
**Lingkungan:** Windows EPERM `npm ci` di pohon ini karena proses node aktif; `npm ci` terbukti bersih di temp; leftover `next` job process harus di-`taskkill /T`.
