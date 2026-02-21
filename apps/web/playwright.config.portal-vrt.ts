import { defineConfig, devices } from "@playwright/test";

/**
 * Portal VRT (Visual Regression Testing) Playwright config.
 *
 * WHY: Separate from the public VRT config (playwright.config.vrt.ts) because
 * portal pages require:
 *   1. A running Convex dev server (queries/mutations)
 *   2. Auth fixtures from globalSetup (hospital.json, provider.json, admin.json)
 *
 * This config runs against the Next.js dev server (same as the main E2E config)
 * and requires Convex to already be running in a separate terminal:
 *   npx convex dev
 *
 * Tests covered (M5-5 #80 — 50-80 total VRT screenshots):
 *   - e2e/vrt/hospital/hospital-vrt.spec.ts  (15-25 screenshots)
 *   - e2e/vrt/provider/provider-vrt.spec.ts  (10-15 screenshots)
 *   - e2e/vrt/platform-admin/platform-admin-vrt.spec.ts (10-15 screenshots)
 *   - e2e/vrt/portal-visual.spec.ts  (legacy — 3 dashboard screenshots)
 *
 * Update baselines:
 *   PORT=3002 pnpm vrt:portal:update
 *
 * Run comparison:
 *   PORT=3002 pnpm vrt:portal
 *
 * Port configuration:
 *   Default: 3000 (CI)
 *   Override: PORT=3002 for homelab where port 3000 is occupied by Dokploy.
 */

// eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
const port = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  // Run portal VRT specs — includes legacy portal-visual.spec.ts + M5-5 portal directories.
  // Public VRT (auth pages) lives in playwright.config.vrt.ts (no auth required).
  testDir: "./e2e/vrt",
  testMatch: [
    "**/portal-visual.spec.ts",
    "**/hospital/hospital-vrt.spec.ts",
    "**/provider/provider-vrt.spec.ts",
    "**/platform-admin/platform-admin-vrt.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "on",
    // Consistent viewport for reproducible screenshots across environments
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
    // Use dev server (not production) — portal pages need Convex queries.
    // Convex must be running separately: `npx convex dev`
    command: `PORT=${port} pnpm dev`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // WHY: globalSetup creates auth fixtures (hospital.json, provider.json, admin.json)
  // needed by the storageState options in each test.describe block.
  globalSetup: "./e2e/global-setup",
});
