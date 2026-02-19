import { defineConfig, devices } from "@playwright/test";

/**
 * CI-specific Playwright config for Woodpecker pipeline Stage 4.
 *
 * WHY: The full playwright.config.ts runs global-setup which signs up real users
 * against a live Convex backend. In CI, CONVEX_DEPLOYMENT is a placeholder
 * (ci-placeholder.convex.cloud), so auth setup always fails.
 *
 * This config runs only smoke.spec.ts which tests pages that work without
 * a live Convex backend: health endpoint, landing, sign-in, sign-up,
 * security headers, 404 handling.
 *
 * Uses `pnpm start` (production server) instead of `pnpm dev` because:
 * 1. Faster startup — Stage 1 already built `.next/` which is shared in workspace
 * 2. Identical to production — security headers, cache-control, same behavior
 * 3. Avoids dev-mode compilation timeout in Docker containers
 *
 * For full E2E with auth, run: pnpm e2e (requires live Convex backend)
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/smoke.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Use production server — Stage 1 already built .next/ (shared workspace)
    // This is faster and matches production behavior (headers, caching, etc.)
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
  // No globalSetup — smoke tests don't require authenticated sessions
});
