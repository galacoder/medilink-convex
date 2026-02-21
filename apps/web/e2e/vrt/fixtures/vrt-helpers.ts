import type { Page } from "@playwright/test";

/**
 * VRT Helper utilities for Visual Regression Tests.
 *
 * WHY: Centralizes common VRT patterns (animation disabling, dynamic content
 * masking, page stabilization) to keep individual VRT spec files concise and
 * consistent across hospital, provider, and admin portals.
 *
 * These helpers do NOT replace Playwright fixtures — they are utility functions
 * imported directly into VRT spec files.
 */

/**
 * Disable all CSS animations and transitions for stable VRT screenshots.
 *
 * WHY: Animated loaders, skeleton screens, hover transitions, and entrance
 * animations cause pixel-level differences that are NOT visual regressions.
 * Disabling them makes screenshot comparison deterministic across environments.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        animation-delay: 0s !important;
        transition-delay: 0s !important;
        animation-iteration-count: 1 !important;
      }
    `,
  });
}

/**
 * Wait for a portal page to fully stabilize before taking a screenshot.
 *
 * WHY: Portal pages render async data from Convex. We wait for networkidle
 * so Convex query results have loaded, then add 500ms for React re-renders.
 * This prevents screenshots capturing "loading" states instead of "loaded" states.
 */
export async function waitForPageStable(
  page: Page,
  timeout = 20_000,
): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForTimeout(500);
}

/**
 * Navigate to an admin page and check if the admin session is valid.
 *
 * WHY: Admin VRT tests require ADMIN_SETUP_SECRET to be set during global-setup.
 * If the secret is missing, admin.json has no cookies and all navigations
 * redirect to /sign-in. This helper returns false in that case so tests
 * can skip gracefully via test.skip().
 *
 * @returns true if the page loaded successfully, false if redirected to sign-in
 */
export async function gotoAdminPage(
  page: Page,
  path: string,
): Promise<boolean> {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  if (currentUrl.includes("/sign-in")) {
    return false;
  }

  await waitForPageStable(page);
  return true;
}

/**
 * Common dynamic content selectors to mask in VRT screenshots.
 *
 * WHY: These selectors match elements with content that changes between runs
 * (timestamps, relative times, user avatars) that would cause false positives
 * in VRT comparison even when there are no real visual regressions.
 */
export const DYNAMIC_CONTENT_MASKS = {
  timestamps: '[data-testid="timestamp"]',
  avatars: '[data-testid="avatar"]',
  relativeTime: "time",
  chartTooltips: '[data-testid="chart-tooltip"]',
} as const;
