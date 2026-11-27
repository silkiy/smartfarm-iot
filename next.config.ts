import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Security headers, industry standard (OWASP Secure Headers + Next.js 16
 * "Without Nonces" CSP). HSTS is already emitted by the Vercel platform, so it
 * is not duplicated here.
 *
 * CSP note: strict nonce-based CSP requires dynamic rendering and is
 * incompatible with `cacheComponents` + partial prefetching. We use Next.js's
 * documented no-nonce fallback. Revisit nonce/SRI once routing is added and
 * pages can opt into dynamic rendering.
 */
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

/**
 * CORS policy (industry standard): never `*`. This app is same-origin and its
 * ESP32 clients call `/api/iot/*` server-to-server, so cross-origin browser
 * access is not needed. When our own origin is known (AUTH_URL) we emit an
 * explicit allowlist entry; otherwise no CORS header is emitted. No
 * `Access-Control-Allow-Credentials`.
 *
 * Any `Access-Control-Allow-Origin: *` seen on the deployed site comes from
 * the Vercel platform, not this app; verify on the live origin.
 */
const appOrigin = process.env.AUTH_URL;

const corsHeaders = appOrigin
  ? [{ key: "Access-Control-Allow-Origin", value: appOrigin }]
  : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          ...corsHeaders,
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
