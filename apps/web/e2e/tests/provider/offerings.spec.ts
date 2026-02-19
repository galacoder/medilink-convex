import { expect, test } from "../../fixtures/hospital";
import { ProviderOfferingsPage } from "../../pages/provider/offerings.page";

/**
 * Provider offerings E2E smoke tests.
 *
 * WHY: This test validates the full auth -> page -> component chain for
 * the service offerings management screen. It verifies:
 * 1. Provider auth fixture grants access to /provider/offerings
 * 2. The Vietnamese page heading renders correctly
 * 3. The offering-list container is present for further E2E targeting
 *
 * Uses the providerPage auth fixture (pre-authenticated via global-setup).
 * Follows the exact pattern of quote.spec.ts.
 */
test.describe("Provider service offerings", () => {
  /**
   * Test: Provider user can view service offerings page.
   *
   * WHY: Verifies the offerings page renders with correct heading and list
   * container, confirming the provider auth session grants access to the
   * new offerings route and that Convex query integration does not error.
   */
  test("provider user can view offerings page", async ({ providerPage }) => {
    const offeringsPage = new ProviderOfferingsPage(providerPage);
    await offeringsPage.goto();

    // Page should be accessible (not redirected to sign-in)
    await expect(providerPage).toHaveURL(/\/provider\/offerings/, {
      timeout: 15000,
    });

    // The offering list container should always be present (even when empty)
    await expect(offeringsPage.list).toBeVisible({ timeout: 10000 });

    // Page heading should display in Vietnamese
    await expect(offeringsPage.heading).toContainText("Quản lý Dịch vụ");
  });

  /**
   * Test: New offering form page is accessible.
   *
   * WHY: Verifies the /provider/offerings/new route renders a form, confirming
   * Next.js nested route creation worked correctly.
   */
  test("provider user can access new offering form", async ({
    providerPage,
  }) => {
    await providerPage.goto("/provider/offerings/new");

    await expect(providerPage).toHaveURL(/\/provider\/offerings\/new/, {
      timeout: 15000,
    });

    // The form should be visible
    await expect(
      providerPage.locator('[data-testid="offering-form"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});
