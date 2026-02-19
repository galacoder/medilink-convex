import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

/**
 * Hospital-specific Playwright fixture for MediLink E2E tests.
 *
 * WHY: Extends the base auth fixture pattern from auth.ts with hospitalPage
 * and providerPage fixtures loaded from storageState. This file is the
 * preferred import for hospital-portal test files, while auth.ts remains
 * the canonical source for the fixture interface.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/hospital';
 *   test('my test', async ({ hospitalPage }) => { ... });
 */

interface HospitalFixtures {
  hospitalPage: Page;
  providerPage: Page;
}

export const test = base.extend<HospitalFixtures>({
  /**
   * Pre-authenticated hospital user page.
   * Session loaded from ./e2e/.auth/hospital.json (created in global-setup).
   *
   * WHY: Avoids repeating the 3-step sign-up flow (~30s) for each test.
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
   * WHY: Allows cross-portal tests (hospital creates request, provider views it)
   * without repeated login flows.
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
