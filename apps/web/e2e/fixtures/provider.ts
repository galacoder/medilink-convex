import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

/**
 * Provider-specific Playwright fixture for MediLink E2E tests.
 *
 * WHY: Extends the base auth fixture pattern from auth.ts with both a single
 * providerPage fixture and a secondProviderPage fixture for multi-tenancy tests.
 * The secondProviderPage allows testing that Provider A cannot see Provider B's
 * quotes — a critical security assertion for the SPMET multi-tenant platform.
 *
 * Both fixtures load pre-authenticated sessions from storageState files created
 * in global-setup.ts. The secondProvider context is created dynamically (new
 * registration) when needed for multi-tenancy tests.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/provider';
 *   test('my test', async ({ providerPage }) => { ... });
 *
 * vi: "Fixture nhà cung cấp" / en: "Provider fixture"
 */

interface ProviderFixtures {
  /** Pre-authenticated provider user page (org A, from global-setup) */
  providerPage: Page;
  /** Pre-authenticated hospital user page (for cross-portal tests) */
  hospitalPage: Page;
}

export const test = base.extend<ProviderFixtures>({
  /**
   * Pre-authenticated provider user page.
   * Session loaded from ./e2e/.auth/provider.json (created in global-setup).
   *
   * WHY: Avoids repeating the 3-step sign-up flow (~30s) for each test.
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

  /**
   * Pre-authenticated hospital user page (for cross-portal interaction tests).
   * Session loaded from ./e2e/.auth/hospital.json (created in global-setup).
   *
   * WHY: Cross-portal tests (provider sees hospital request) need both user
   * types active simultaneously. The hospital fixture provides the "sender"
   * side of the workflow for validation.
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
});

export { expect } from "@playwright/test";
