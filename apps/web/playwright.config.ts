import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for MediLink.
 *
 * WHY: Centralizes test runner settings, browser selection, and webServer
 * startup so all tests run consistently against a real Next.js instance.
 *
 * CI behaviour:
 *   - Placeholder Convex URL (.env.ci): only smoke tests run (no auth required)
 *   - Real Convex URL (local dev / staging): full suite including auth flows
 *
 * References:
 * - https://playwright.dev/docs/test-configuration
 */

// In CI, .env.ci sets NEXT_PUBLIC_CONVEX_URL to a placeholder value.
// Auth-dependent tests (sign-up, equipment, service-request, provider) require
// a real Convex backend and are skipped when the placeholder URL is detected.
const isPlaceholderConvex =
  process.env.NEXT_PUBLIC_CONVEX_URL?.includes("placeholder") ?? false;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  // Skip auth-dependent tests when running against placeholder Convex (CI env)
  testIgnore: isPlaceholderConvex ? ["**/tests/**"] : [],
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
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // globalSetup creates auth state files for tests that reuse sessions.
  // Only run when a real Convex backend is available (skipped in CI placeholder mode).
  ...(isPlaceholderConvex ? {} : { globalSetup: "./e2e/global-setup" }),
});
