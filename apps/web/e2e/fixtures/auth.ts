import { test as base  } from "@playwright/test";
import type {Page} from "@playwright/test";

/**
 * Auth fixtures for MediLink E2E tests.
 *
 * WHY: Reusable authenticated browser contexts prevent every test from
 * repeating the 3-step sign-up flow (~30 seconds per test). storageState
 * files are created once in global-setup.ts and reused here.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/auth';
 *   test('my test', async ({ hospitalPage }) => { ... });
 */

interface AuthFixtures {
  hospitalPage: Page;
  providerPage: Page;
}

export const test = base.extend<AuthFixtures>({
  /**
   * Pre-authenticated hospital user page.
   * Session loaded from ./e2e/.auth/hospital.json (created in global-setup).
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
