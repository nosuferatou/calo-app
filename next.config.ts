import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// The Supabase origin is the only third-party endpoint the browser talks to.
function connectSrc(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return "'self'";
  try {
    const url = new URL(raw);
    return `'self' ${url.protocol}//${url.host} wss://${url.host}`;
  } catch {
    return "'self'";
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `connect-src ${connectSrc()}`,
  "img-src 'self' data:",
  "font-src 'self'",
  // Next.js ships inline bootstrapping scripts and style attributes.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
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
  // CSP and HSTS are production-only: in `next dev` the strict policy blocks
  // the hot-reload transport and makes local development look broken.
  async headers() {
    if (!isProduction) return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
