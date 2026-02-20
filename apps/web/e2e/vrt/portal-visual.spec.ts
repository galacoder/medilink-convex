import { expect, test } from "@playwright/test";

/**
 * Portal Visual Regression Tests — authenticated dashboards.
 *
 * WHY: The public VRT spec (visual.spec.ts) only covers 3 unauthenticated
 * pages. The portal dashboards are the primary user entry points and must
 * be covered by visual regression to catch regressions on real auth flows.
 *
 * Each describe block uses a different storageState fixture loaded from
 * e2e/.auth/{portal}.json (created by global-setup before these tests run).
 *
 * Prerequisites:
 *   - Convex dev server running (`npx convex dev` in a separate terminal)
 *   - Auth fixtures exist (created by global-setup or a prior E2E run)
 *
 * Update baselines:  PORT=3002 pnpm exec playwright test --config=playwright.config.portal-vrt.ts --update-snapshots
 * Run comparison:    pnpm exec playwright test --config=playwright.config.portal-vrt.ts
 *
 * Threshold: 5% pixel tolerance — accounts for font-rendering differences
 * between local homelab and CI Docker containers.
 */

test.beforeEach(async ({ page }) => {
  // Disable CSS animations and transitions for stable screenshots.
  // WHY: Animated elements (loaders, transitions) cause flaky pixel diffs.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
});

// ---------------------------------------------------------------------------
// Hospital portal
// ---------------------------------------------------------------------------

test.describe("Hospital portal VRT", () => {
  // WHY: storageState loads the pre-authenticated hospital session created by
  // global-setup so we don't repeat the full sign-up flow for each VRT test.
  test.use({ storageState: "./e2e/.auth/hospital.json" });

  test("hospital dashboard visual regression", async ({ page }) => {
    await page.goto("/hospital/dashboard");
    // Wait for the page to settle after authentication redirect
    await page.waitForURL(/\/hospital\/dashboard/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("hospital-dashboard.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// ---------------------------------------------------------------------------
// Provider portal
// ---------------------------------------------------------------------------

test.describe("Provider portal VRT", () => {
  // WHY: Same rationale as hospital — reuse global-setup provider session.
  test.use({ storageState: "./e2e/.auth/provider.json" });

  test("provider dashboard visual regression", async ({ page }) => {
    await page.goto("/provider/dashboard");
    await page.waitForURL(/\/provider\/dashboard/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("provider-dashboard.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// ---------------------------------------------------------------------------
// Admin portal
// ---------------------------------------------------------------------------

test.describe("Admin portal VRT", () => {
  // WHY: Admin session requires ADMIN_SETUP_SECRET + NEXT_PUBLIC_CONVEX_SITE_URL
  // to have been set during global-setup. If env vars were missing, admin.json
  // will have no cookies and the page will redirect to sign-in — we skip gracefully.
  test.use({ storageState: "./e2e/.auth/admin.json" });

  test("admin dashboard visual regression", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Wait for navigation to settle — could be /admin/dashboard or /sign-in
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1_000);

    const currentUrl = page.url();
    if (currentUrl.includes("/sign-in")) {
      // Admin fixture not configured — skip rather than fail.
      // To enable: set ADMIN_SETUP_SECRET + NEXT_PUBLIC_CONVEX_SITE_URL in .env.local
      test.skip(true, "Admin not configured — ADMIN_SETUP_SECRET not set");
    }

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("admin-dashboard.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
