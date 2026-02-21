import { expect, test } from "@playwright/test";

/**
 * Hospital portal Visual Regression Tests — 15-25 screenshots.
 *
 * WHY: Captures the hospital portal's full UI surface area to detect
 * unintended visual regressions across all major hospital workflows:
 * equipment management, service requests, QR scanning, consumables,
 * disputes, and settings.
 *
 * Prerequisites:
 *   - Auth fixture: e2e/.auth/hospital.json (created by global-setup)
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

// WHY: storageState reuses the pre-authenticated hospital session from global-setup
// to avoid repeating the 3-step sign-up flow (~30s) for every VRT screenshot test.
test.use({ storageState: "./e2e/.auth/hospital.json" });

test.beforeEach(async ({ page }) => {
  // Disable CSS animations and transitions for stable, reproducible screenshots.
  // WHY: Animated loaders, skeleton screens, and hover transitions cause pixel
  // diffs that are not actual visual regressions.
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
// Dashboard
// ---------------------------------------------------------------------------

test("@vrt hospital dashboard", async ({ page }) => {
  await page.goto("/hospital/dashboard");
  await page.waitForURL(/\/hospital\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-dashboard.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator('[data-testid="avatar"]'),
      page.locator("time"),
    ],
  });
});

// ---------------------------------------------------------------------------
// Equipment pages (list, detail, create) — 3 screenshots
// ---------------------------------------------------------------------------

test("@vrt hospital equipment list", async ({ page }) => {
  await page.goto("/hospital/equipment");
  await page.waitForURL(/\/hospital\/equipment/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-equipment-list.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt hospital equipment create", async ({ page }) => {
  await page.goto("/hospital/equipment/new");
  await page.waitForURL(/\/hospital\/equipment\/new/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-equipment-create.png", {
    maxDiffPixelRatio: 0.05,
  });
});

test("@vrt hospital equipment detail", async ({ page }) => {
  // Navigate to equipment list first and click the first item if it exists;
  // otherwise navigate to list and screenshot (equipment may be empty in CI).
  await page.goto("/hospital/equipment");
  await page.waitForURL(/\/hospital\/equipment/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Try to click the first equipment row to open detail view
  const firstRow = page.locator("table tbody tr").first();
  const hasRows = await firstRow.isVisible().catch(() => false);

  if (hasRows) {
    await firstRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }

  await expect(page).toHaveScreenshot("hospital-equipment-detail.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Service request pages (list, detail, create) — 3 screenshots
// ---------------------------------------------------------------------------

test("@vrt hospital service request list", async ({ page }) => {
  await page.goto("/hospital/service-requests");
  await page.waitForURL(/\/hospital\/service-requests/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-service-request-list.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt hospital service request create", async ({ page }) => {
  await page.goto("/hospital/service-requests/new");
  await page.waitForURL(/\/hospital\/service-requests\/new/, {
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-service-request-create.png", {
    maxDiffPixelRatio: 0.05,
  });
});

test("@vrt hospital service request detail", async ({ page }) => {
  await page.goto("/hospital/service-requests");
  await page.waitForURL(/\/hospital\/service-requests/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const firstRow = page.locator("table tbody tr").first();
  const hasRows = await firstRow.isVisible().catch(() => false);

  if (hasRows) {
    await firstRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }

  await expect(page).toHaveScreenshot("hospital-service-request-detail.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// QR Scanner — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt hospital qr scan", async ({ page }) => {
  await page.goto("/hospital/scan");
  await page.waitForURL(/\/hospital\/scan/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-qr-scan.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Consumables — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt hospital consumables", async ({ page }) => {
  await page.goto("/hospital/consumables");
  await page.waitForURL(/\/hospital\/consumables/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-consumables.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Disputes — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt hospital disputes", async ({ page }) => {
  await page.goto("/hospital/disputes");
  await page.waitForURL(/\/hospital\/disputes/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-disputes.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

// ---------------------------------------------------------------------------
// Settings — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt hospital settings", async ({ page }) => {
  await page.goto("/hospital/settings");
  await page.waitForURL(/\/hospital\/settings/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-settings.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Members — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt hospital members", async ({ page }) => {
  await page.goto("/hospital/members");
  await page.waitForURL(/\/hospital\/members/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-members.png", {
    maxDiffPixelRatio: 0.05,
    mask: [
      page.locator('[data-testid="avatar"]'),
      page.locator('[data-testid="timestamp"]'),
    ],
  });
});

// ---------------------------------------------------------------------------
// Responsive — mobile screenshots (375x667) for key pages — 3 screenshots
// ---------------------------------------------------------------------------

test("@vrt hospital equipment list mobile", async ({ page }) => {
  // WHY: Mobile viewport reveals layout issues hidden at desktop widths.
  // Hospital equipment list is the most critical workflow for students
  // scanning/borrowing equipment — must render correctly on mobile devices.
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/hospital/equipment");
  await page.waitForURL(/\/hospital\/equipment/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-equipment-list-mobile.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt hospital dashboard mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/hospital/dashboard");
  await page.waitForURL(/\/hospital\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-dashboard-mobile.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt hospital service requests mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/hospital/service-requests");
  await page.waitForURL(/\/hospital\/service-requests/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot(
    "hospital-service-request-list-mobile.png",
    {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
    },
  );
});

// ---------------------------------------------------------------------------
// Dark mode — hospital dashboard and equipment in dark theme — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt hospital dashboard dark mode", async ({ page }) => {
  // WHY: Dark mode is a first-class feature for medical staff working in
  // low-light environments (operating rooms, overnight shifts).
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/hospital/dashboard");
  await page.waitForURL(/\/hospital\/dashboard/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-dashboard-dark.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});

test("@vrt hospital equipment list dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/hospital/equipment");
  await page.waitForURL(/\/hospital\/equipment/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("hospital-equipment-list-dark.png", {
    maxDiffPixelRatio: 0.05,
    mask: [page.locator('[data-testid="timestamp"]'), page.locator("time")],
  });
});
