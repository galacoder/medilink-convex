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
 * Tests covered:
 *   - /hospital/dashboard (hospital storageState)
 *   - /provider/dashboard (provider storageState)
 *   - /admin/dashboard   (admin storageState — skipped if ADMIN_SETUP_SECRET unset)
 *
 * Update baselines:
 *   PORT=3002 pnpm exec playwright test --config=playwright.config.portal-vrt.ts --update-snapshots
 *
 * Run comparison:
 *   PORT=3002 pnpm exec playwright test --config=playwright.config.portal-vrt.ts
 *
 * Port configuration:
 *   Default: 3000 (CI)
 *   Override: PORT=3002 for homelab where port 3000 is occupied by Dokploy.
 */

// eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
const port = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  // Only run portal VRT spec — public VRT lives in visual.spec.ts (public config)
  testDir: "./e2e/vrt",
  testMatch: "**/portal-visual.spec.ts",
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
