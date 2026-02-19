import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for MediLink.
 *
 * WHY: Centralizes test runner settings, browser selection, and webServer
 * startup so all tests run consistently against a real Next.js instance.
 *
 * References:
 * - https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
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
    /**
     * Provider portal test project (M3-5).
     *
     * WHY: Separating the provider portal tests into its own named project
     * allows CI to run provider E2E tests independently from hospital and
     * auth tests. This enables targeted re-runs when only provider features
     * change, reducing feedback time in the Woodpecker stage 4 pipeline.
     *
     * Runs all spec files under e2e/provider/ using Chromium.
     * Uses the same global-setup as other projects (provider session created there).
     */
    {
      name: "provider-portal",
      testDir: "./e2e/provider",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  globalSetup: "./e2e/global-setup",
});
