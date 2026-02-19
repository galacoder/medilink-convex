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
 */
export default defineConfig({
  testDir: "./e2e/vrt",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
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
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // No globalSetup — VRT tests use public pages only
});
