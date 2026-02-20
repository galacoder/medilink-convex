import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/**
 * Security and caching headers applied to ALL environments (dev, build, Vercel).
 *
 * WHY: vercel.json headers only apply on Vercel deployments. Defining headers
 * here ensures they are present in `next dev`, `next start`, and CI smoke tests.
 * vercel.json can remain as a fallback for CDN-level caching control.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import("next").NextConfig} */
const config = {
  /** Allow cross-origin /_next/* requests from homelab network IP */
  allowedDevOrigins: ["192.168.2.18"],

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@medilink/api",
    "@medilink/auth",
    "@medilink/db",
    "@medilink/ui",
    "@medilink/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Force no-cache on health endpoint so monitoring always gets fresh state
        source: "/api/health",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default config;
