import { expect, test } from "@playwright/test";

/**
 * Provider portal Visual Regression Tests — 10-15 screenshots.
 *
 * WHY: Captures the provider portal's full UI surface area to detect
 * unintended visual regressions across all major provider workflows:
 * offerings, quotes, services, analytics, profile, and certifications.
 *
 * Prerequisites:
 *   - Auth fixture: e2e/.auth/provider.json (created by global-setup)
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

// WHY: storageState reuses the pre-authenticated provider session from global-setup
// to avoid repeating the full sign-up flow for every VRT screenshot test.
test.use({ storageState: "./e2e/.auth/provider.json" });

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

test("@vrt provider dashboard", async ({ page }) => {
  await page.goto("/provider/dashboard");
  await page.waitForURL(/\/provider\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-dashboard.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator('[data-testid="avatar"]'),
      page.locator("time"),
    ],
  });
});

// ---------------------------------------------------------------------------
// Offerings (list, create) — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt provider offerings list", async ({ page }) => {
  await page.goto("/provider/offerings");
  await page.waitForURL(/\/provider\/offerings/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-offerings-list.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt provider offerings create", async ({ page }) => {
  await page.goto("/provider/offerings/new");
  await page.waitForURL(/\/provider\/offerings\/new/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-offerings-create.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Quotes — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider quotes", async ({ page }) => {
  await page.goto("/provider/quotes");
  await page.waitForURL(/\/provider\/quotes/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-quotes.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Services — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider services", async ({ page }) => {
  await page.goto("/provider/services");
  await page.waitForURL(/\/provider\/services/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-services.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Analytics — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider analytics", async ({ page }) => {
  await page.goto("/provider/analytics");
  await page.waitForURL(/\/provider\/analytics/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-analytics.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator("time"),
      // Chart tooltips and dynamic labels may vary
      page.locator('[data-testid="chart-tooltip"]'),
    ],
  });
});

// ---------------------------------------------------------------------------
// Profile — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider profile", async ({ page }) => {
  await page.goto("/provider/profile");
  await page.waitForURL(/\/provider\/profile/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-profile.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="avatar"]'),
      page.locator('[data-testid="timestamp"]'),
    ],
  });
});

// ---------------------------------------------------------------------------
// Certifications — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider certifications", async ({ page }) => {
  await page.goto("/provider/certifications");
  await page.waitForURL(/\/provider\/certifications/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-certifications.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Members — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider members", async ({ page }) => {
  await page.goto("/provider/members");
  await page.waitForURL(/\/provider\/members/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-members.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="avatar"]'),
      page.locator('[data-testid="timestamp"]'),
    ],
  });
});

// ---------------------------------------------------------------------------
// Settings — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt provider settings", async ({ page }) => {
  await page.goto("/provider/settings");
  await page.waitForURL(/\/provider\/settings/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-settings.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Responsive — mobile screenshots (375x667) — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt provider quotes mobile", async ({ page }) => {
  // WHY: Mobile viewport for quotes is a key workflow — providers respond to
  // quote requests from mobile devices in the field.
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/provider/quotes");
  await page.waitForURL(/\/provider\/quotes/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-quotes-mobile.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt provider dashboard mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/provider/dashboard");
  await page.waitForURL(/\/provider\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-dashboard-mobile.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Dark mode — provider dashboard and offerings — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt provider dashboard dark mode", async ({ page }) => {
  // WHY: Provider technicians work in varied lighting; dark mode is critical
  // for readability on equipment service calls.
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/provider/dashboard");
  await page.waitForURL(/\/provider\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-dashboard-dark.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt provider quotes dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/provider/quotes");
  await page.waitForURL(/\/provider\/quotes/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("provider-quotes-dark.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});
