import { expect, test } from "@playwright/test";

/**
 * Auth pages Visual Regression Tests — 5-8 screenshots.
 *
 * WHY: Auth pages are the entry points for all users. Visual regressions here
 * directly impact first impressions and onboarding success rates for hospital
 * staff and medical equipment providers at SPMET Healthcare School.
 *
 * These tests run WITHOUT auth fixtures — all pages are public and render
 * without a Convex backend connection. They use the same public VRT config
 * (playwright.config.vrt.ts) as the existing visual.spec.ts.
 *
 * Tagged @vrt for selective CI execution in Woodpecker stage 5.
 *
 * Update baselines: pnpm vrt:update
 * Run comparison:   pnpm vrt
 *
 * Viewport: 1280x720 (desktop, configured in playwright.config.vrt.ts)
 * Threshold: 5% pixel tolerance for font-rendering cross-environment consistency
 */

test.beforeEach(async ({ page }) => {
  // Disable CSS animations and transitions for stable, reproducible screenshots.
  // WHY: Form field focus animations, loading spinners cause pixel diff noise.
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
// Sign-in page — desktop and mobile — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt sign-in page", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-sign-in.png", {
    maxDiffPixelRatio: 0.05,
  });
});

test("@vrt sign-in page mobile", async ({ page }) => {
  // WHY: Many hospital staff and students use mobile devices to sign in before
  // clinical rounds. Mobile layout of the sign-in form is critical for usability.
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-sign-in-mobile.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Sign-up pages — hospital and provider — 2 screenshots
// ---------------------------------------------------------------------------

test("@vrt hospital sign-up page", async ({ page }) => {
  // WHY: Hospital sign-up has a multi-step form (hospital info → contact → admin).
  // Captures the initial state of the first step.
  await page.goto("/sign-up");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-sign-up-hospital.png", {
    maxDiffPixelRatio: 0.05,
  });
});

test("@vrt provider sign-up page", async ({ page }) => {
  // WHY: Provider sign-up has different fields than hospital sign-up
  // (certifications, service areas). Captures distinct provider form layout.
  await page.goto("/sign-up");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  // If there's a toggle to switch between hospital/provider sign-up types,
  // click it to capture the provider variant.
  const providerTab = page
    .locator('[data-testid="provider-tab"], [role="tab"]:has-text("Provider")')
    .first();
  const hasProviderTab = await providerTab.isVisible().catch(() => false);

  if (hasProviderTab) {
    await providerTab.click();
    await page.waitForTimeout(300);
  }

  await expect(page).toHaveScreenshot("auth-sign-up-provider.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Invite acceptance page — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt invite acceptance page", async ({ page }) => {
  // WHY: Team member invitations are how hospital admin delegates access.
  // The invite page must render correctly even without a valid token.
  await page.goto("/invite");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-invite-acceptance.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Dark mode — sign-in page — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt sign-in page dark mode", async ({ page }) => {
  // WHY: Dark mode auth pages are used in low-light medical environments.
  // Sign-in is the most critical auth page — must render correctly in dark theme.
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-sign-in-dark.png", {
    maxDiffPixelRatio: 0.05,
  });
});

// ---------------------------------------------------------------------------
// Sign-up dark mode — 1 screenshot
// ---------------------------------------------------------------------------

test("@vrt sign-up page dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/sign-up");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("auth-sign-up-dark.png", {
    maxDiffPixelRatio: 0.05,
  });
});
