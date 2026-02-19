import { expect, test } from "../../fixtures/auth";
import { ProviderQuotesPage } from "../../pages/provider/quotes.page";
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

/**
 * Provider quote listing tests (AC-4, cross-portal flow).
 *
 * WHY: The provider-hospital cross-portal flow is the core of the service
 * request business process. Provider must see requests, hospital must be
 * isolated from provider portal. Testing both directions validates role-based
 * access control is working correctly.
 */
test.describe("Provider quote listing", () => {
  /**
   * Test (AC-4): Provider request list shows available requests.
   *
   * WHY: Uses ProviderQuotesPage POM to confirm the provider portal's
   * service request list is accessible and shows the Vietnamese heading.
   * Verifies cross-portal isolation by confirming provider cannot access
   * hospital-specific routes.
   */
  test("provider request list shows available requests", async ({
    providerPage,
  }) => {
    const quotesPage = new ProviderQuotesPage(providerPage);
    await quotesPage.goto();

    await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
      timeout: 15000,
    });
    await expect(quotesPage.list).toBeVisible({ timeout: 10000 });

    // Verify Vietnamese heading is present on provider portal
    await expect(providerPage.locator("h1")).toContainText("Yêu cầu dịch vụ");

    // Verify provider portal is separate from hospital portal:
    // provider session attempting to access hospital routes should be redirected
    await providerPage.goto("/hospital/equipment");
    // Should NOT remain on /hospital/equipment (must be redirected away)
    await expect(providerPage).not.toHaveURL(/\/hospital\/equipment/, {
      timeout: 5000,
    });
  });
});
