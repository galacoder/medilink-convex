import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Platform Admin portal Visual Regression Tests — 10-15 screenshots.
 *
 * WHY: Captures the platform admin portal's full UI surface area to detect
 * unintended visual regressions across all major admin workflows:
 * dashboard, hospitals, providers, service requests, disputes,
 * audit log, and analytics.
 *
 * Prerequisites:
 *   - Auth fixture: e2e/.auth/admin.json (created by global-setup)
 *   - Requires ADMIN_SETUP_SECRET + NEXT_PUBLIC_CONVEX_SITE_URL in .env.local
 *   - Convex dev server running (npx convex dev)
 *
 * Tagged @vrt for selective CI execution in Woodpecker stage 5.
 *
 * Update baselines: pnpm vrt:portal:update
 * Run comparison:   pnpm vrt:portal
 *
 * Viewport: 1280x720 (desktop, configured in playwright.config.portal-vrt.ts)
 * Threshold: 5% pixel tolerance for font-rendering cross-environment consistency
 */

// WHY: storageState reuses the pre-authenticated admin session from global-setup.
// Admin tests skip gracefully when ADMIN_SETUP_SECRET is not configured.
test.use({ storageState: "./e2e/.auth/admin.json" });

/**
 * Helper: navigate to an admin page and skip gracefully if redirected to sign-in.
 *
 * WHY: The admin session requires ADMIN_SETUP_SECRET to be set in global-setup.
 * If the env var is missing, admin.json has no cookies and all navigations
 * redirect to /sign-in. Rather than failing hard, we skip the test with a
 * clear message so the CI summary shows "skipped" not "failed".
 */
async function gotoAdminPage(page: Page, path: string): Promise<boolean> {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  if (currentUrl.includes("/sign-in")) {
    return false;
  }

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  return true;
}

test.beforeEach(async ({ page }) => {
  // Disable CSS animations and transitions for stable, reproducible screenshots.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        animation-delay: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
});

// ---------------------------------------------------------------------------
// Dashboard — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin dashboard", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/dashboard");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-dashboard.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator('[data-testid="avatar"]'),
      page.locator("time"),
    ],
  });
});

// ---------------------------------------------------------------------------
// Hospitals (list, detail) — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt admin hospitals list", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/hospitals");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-hospitals-list.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt admin hospital detail", async ({ page }) => {
  const listReady = await gotoAdminPage(page, "/admin/hospitals");
  if (!listReady) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  // Try to click the first hospital row to open detail view
  const firstRow = page.locator("table tbody tr").first();
  const hasRows = await firstRow.isVisible().catch(() => false);

  if (hasRows) {
    await firstRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }

  await expect(page).toHaveScreenshot("admin-hospital-detail.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Providers (list, detail) — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt admin providers list", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/providers");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-providers-list.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt admin provider detail", async ({ page }) => {
  const listReady = await gotoAdminPage(page, "/admin/providers");
  if (!listReady) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  const firstRow = page.locator("table tbody tr").first();
  const hasRows = await firstRow.isVisible().catch(() => false);

  if (hasRows) {
    await firstRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }

  await expect(page).toHaveScreenshot("admin-provider-detail.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Service Requests — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin service requests", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/service-requests");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-service-requests.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Disputes — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin disputes", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/disputes");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-disputes.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Audit Log — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin audit log", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/audit-log");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-audit-log.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      // Timestamps in audit log entries are always dynamic — mask them all
      page.locator('[data-testid="timestamp"]'),
      page.locator("time"),
      page.locator("td:last-child"), // Last column often contains relative timestamps
    ],
  });
});

// ---------------------------------------------------------------------------
// Analytics — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin analytics", async ({ page }) => {
  const ready = await gotoAdminPage(page, "/admin/analytics");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-analytics.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator("time"),
      page.locator('[data-testid="chart-tooltip"]'),
    ],
  });
});

// ---------------------------------------------------------------------------
// Dark mode — admin dashboard — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt admin dashboard dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });

  const ready = await gotoAdminPage(page, "/admin/dashboard");
  if (!ready) {
    test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
  }

  await expect(page).toHaveScreenshot("admin-dashboard-dark.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});
