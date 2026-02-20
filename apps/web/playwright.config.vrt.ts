import { defineConfig, devices } from "@playwright/test";

/**
 * VRT (Visual Regression Testing) Playwright config.
 *
 * WHY: Captures screenshots of public pages and compares them against
 * committed baselines to detect unintended visual regressions.
 *
 * Only tests pages that render without a live Convex backend:
 * - Landing/marketing page (/)
 * - Sign-in page (/sign-in)
 * - Sign-up page (/sign-up)
 *
 * Baselines stored in: e2e/vrt/__snapshots__/
 * Update baselines: pnpm vrt:update
 * Run comparison: pnpm vrt
 *
 * Port configuration:
 *   Default: 3000 (used in CI after `pnpm build && pnpm start`)
 *   Override: PORT=3002 pnpm vrt:update (when local port 3000 is occupied)
 *   WHY: On the MediLink homelab, port 3000 is occupied by Dokploy.
 *   Setting PORT=3002 allows VRT to run against the dev server on port 3002.
 */

// eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
const port = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e/vrt",
  // Exclude portal VRT tests — those require auth fixtures and a live Convex backend.
  // Run portal VRT separately: pnpm exec playwright test --config=playwright.config.portal-vrt.ts
  testIgnore: ["**/portal-visual.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "on",
    // Consistent viewport for reproducible screenshots
    viewport: { width: 1280, height: 720 },
  },
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Use production server — Stage 1 built .next/ (shared workspace in CI)
    // Ensures consistent screenshots matching production rendering
    command: `pnpm start --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
  // No globalSetup — VRT tests use public pages only
});
