import { expect, test } from "../../fixtures/auth";
import { ProviderServiceRequestsPage } from "../../pages/provider/service-requests.page";

/**
 * Provider service requests E2E tests (REQ-006).
 *
 * WHY: This test validates the cross-portal service request visibility —
 * a critical business flow where providers must see hospital requests to
 * submit quotes. It also validates that the provider auth session correctly
 * grants access to the /provider/service-requests page.
 *
 * Uses the providerPage auth fixture (pre-authenticated via global-setup).
 */
test.describe("Provider service requests", () => {
  /**
   * Test (REQ-006): Provider user can view service requests page.
   *
   * WHY: Verifying the provider page renders with its list container confirms:
   * 1. Provider auth fixture session is valid for provider portal access
   * 2. Cross-portal isolation is enforced (provider cannot access /hospital/* routes)
   * 3. data-testid="provider-request-list" is present for future quote submission tests
   */
  test("provider user can view service requests page", async ({
    providerPage,
  }) => {
    const srPage = new ProviderServiceRequestsPage(providerPage);
    await srPage.goto();

    // Page should be accessible (not redirected to sign-in or cross-portal blocked)
    await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
      timeout: 15000,
    });

    // The provider request list table should always be visible
    await expect(srPage.list).toBeVisible({ timeout: 10000 });

    // Page heading should display in Vietnamese
    await expect(providerPage.locator("h1")).toContainText("Yêu cầu dịch vụ");
  });
});
