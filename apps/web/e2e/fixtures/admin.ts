import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

/**
 * Admin-specific Playwright fixture for MediLink E2E tests.
 *
 * WHY: Extends the base test with adminPage, hospitalPage, and providerPage
 * fixtures loaded from storageState files created in global-setup.ts.
 * The admin fixture provides a platform_admin authenticated browser context
 * for testing /admin/* routes without repeating the multi-step admin setup flow.
 *
 * The admin storageState (./e2e/.auth/admin.json) is created by global-setup.ts:
 *   1. Sign up via Better Auth form (hospital placeholder orgType)
 *   2. Call POST /api/admin/set-platform-role via Convex HTTP endpoint
 *   3. Re-authenticate to get fresh session with platformRole in the JWT
 *   4. Wait for proxy Branch 2 redirect to /admin/dashboard
 *   5. Save storageState
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/admin';
 *   test('admin sees dashboard', async ({ adminPage }) => { ... });
 *
 * Cross-portal tests (admin + hospital or provider):
 *   test('admin sees hospital org', async ({ adminPage, hospitalPage }) => { ... });
 *
 * Environment variables required to enable admin setup in global-setup.ts:
 *   NEXT_PUBLIC_CONVEX_SITE_URL — Convex HTTP site URL
 *   ADMIN_SETUP_SECRET — shared secret for the set-platform-role endpoint
 *
 * If these env vars are missing, global-setup writes an empty admin.json
 * (cookies: [], origins: []) and admin tests will skip or show unauthenticated state.
 */

interface AdminFixtures {
  adminPage: Page;
  hospitalPage: Page;
  providerPage: Page;
}

export const test = base.extend<AdminFixtures>({
  /**
   * Pre-authenticated platform admin user page.
   * Session loaded from ./e2e/.auth/admin.json (created in global-setup).
   *
   * WHY: The admin session requires a multi-step bootstrap (signup -> setPlatformRole
   * HTTP call -> re-auth). Loading storageState here avoids repeating this flow
   * for every admin test, saving ~60 seconds per test.
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "./e2e/.auth/admin.json",
    });
    const page = await context.newPage();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await context.close();
  },

  /**
   * Pre-authenticated hospital user page.
   * Session loaded from ./e2e/.auth/hospital.json (created in global-setup).
   *
   * WHY: Some admin tests verify cross-portal visibility — e.g., admin lists
   * hospitals that were created during hospital user signup. Having both
   * adminPage and hospitalPage allows tests to verify the relationship.
   */
  hospitalPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "./e2e/.auth/hospital.json",
    });
    const page = await context.newPage();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await context.close();
  },

  /**
   * Pre-authenticated provider user page.
   * Session loaded from ./e2e/.auth/provider.json (created in global-setup).
   *
   * WHY: Same as hospitalPage rationale — cross-portal tests can verify that
   * the admin portal lists providers created by the provider user.
   */
  providerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "./e2e/.auth/provider.json",
    });
    const page = await context.newPage();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
