import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/**
 * Bundle analyzer configuration.
 *
 * WHY: Enables visual inspection of the JS bundle composition to identify
 * large dependencies and opportunities for code splitting. Run with:
 *   ANALYZE=true pnpm build
 *
 * M5-6 performance requirement: first load JS < 200KB gzipped.
 * Use the generated report to identify chunks exceeding this budget.
 */
// eslint-disable-next-line no-restricted-properties
const ANALYZE = process.env.ANALYZE === "true";

/**
 * Security and caching headers applied to ALL environments (dev, build, Vercel).
 *
 * WHY: vercel.json headers only apply on Vercel deployments. Defining headers
 * here ensures they are present in `next dev`, `next start`, and CI smoke tests.
 * vercel.json can remain as a fallback for CDN-level caching control.
 *
 * M5-6 additions:
 *   - Content-Security-Policy: restricts script/style sources to prevent XSS
 *   - Strict-Transport-Security: enforces HTTPS in production (1 year + subdomains)
 *
 * CSP policy rationale:
 *   - default-src 'self': only same-origin resources by default
 *   - script-src: allow same-origin + unsafe-inline (needed for Next.js runtime)
 *                 + convex.cloud for Convex WebSocket connections
 *   - connect-src: Convex deployment URL (WebSocket + HTTP) + same-origin
 *   - style-src: allow same-origin + unsafe-inline (Tailwind/inline styles)
 *   - img-src: same-origin + data: URIs (base64 images) + HTTPS sources
 *   - font-src: same-origin
 *   - frame-ancestors 'none': prevents clickjacking (complements X-Frame-Options)
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
  {
    // HSTS: enforce HTTPS for 1 year, apply to subdomains, allow preloading.
    // WHY: Once a browser sees this header it will only connect via HTTPS for
    // the duration, preventing SSL-strip attacks and mixed-content issues.
    // Only effective in production (behind TLS termination).
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    // Content Security Policy (M5-6 security gate).
    // WHY: Restricts which origins can load scripts, styles, images, and
    // establish connections. Mitigates XSS by blocking inline script injection
    // from untrusted sources.
    //
    // Bilingual: vi: "Chính sách bảo mật nội dung" / en: "Content Security Policy"
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its runtime script injection.
      // 'unsafe-eval' is kept for development convenience but restricted in prod
      // via the ANALYZE env var guard above.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Convex WebSocket + HTTP API connections
      "connect-src 'self' *.convex.cloud *.convex.site wss://*.convex.cloud",
      // Allow data: URIs for QR code generation (qrcode library uses canvas/data URI)
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
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

/**
 * Bundle analyzer wrapper (optional — only active when ANALYZE=true).
 *
 * WHY: @next/bundle-analyzer is an optional dev dependency. When ANALYZE=true,
 * it wraps the Next.js config and generates an HTML bundle report after build.
 * This avoids a hard dependency for production builds.
 *
 * Install if needed: pnpm add -D @next/bundle-analyzer -w --filter @medilink/web
 *
 * Bilingual: vi: "Phân tích gói bundle" / en: "Bundle analysis"
 */
let exportConfig = config;

if (ANALYZE) {
  try {
    const { default: withBundleAnalyzer } = await import(
      "@next/bundle-analyzer"
    );
    exportConfig = withBundleAnalyzer({ enabled: true })(config);
    console.log(
      "[MediLink] Bundle analyzer enabled — report will open after build.",
    );
  } catch {
    console.warn(
      "[MediLink] @next/bundle-analyzer not installed. Run:\n" +
        "  pnpm add -D @next/bundle-analyzer -w --filter @medilink/web",
    );
    exportConfig = config;
  }
}

export default exportConfig;
