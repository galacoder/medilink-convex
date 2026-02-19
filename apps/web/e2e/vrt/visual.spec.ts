import { expect, test } from "@playwright/test";

/**
 * Visual Regression Tests for MediLink public pages.
 *
 * WHY: Catches unintended visual changes to pages visible to all users.
 * These run in CI (Woodpecker Stage 5) against committed baseline screenshots.
 *
 * Pages tested: landing, sign-in, sign-up (all render without Convex auth).
 *
 * Update baselines: pnpm vrt:update
 * Run comparison: pnpm vrt
 *
 * Threshold: 2% pixel difference tolerance (handles minor font/antialiasing variance)
 */

test.beforeEach(async ({ page }) => {
  // Disable CSS animations and transitions for stable screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
});

test("landing page visual regression", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  // Wait for any lazy-loaded content to settle
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("landing-page.png", {
    maxDiffPixelRatio: 0.02,
    // Mask dynamic content (timestamps, etc.) if any
  });
});

test("sign-in page visual regression", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("sign-in-page.png", {
    maxDiffPixelRatio: 0.02,
  });
});

test("sign-up page visual regression", async ({ page }) => {
  await page.goto("/sign-up");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("sign-up-page.png", {
    maxDiffPixelRatio: 0.02,
  });
});
