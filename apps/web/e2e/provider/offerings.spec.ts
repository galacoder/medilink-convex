import { expect, test } from "../fixtures/provider";
import { ProviderOfferingsPage } from "../pages/provider/offerings.page";

/**
 * Provider onboarding and offerings management E2E tests (M3-5 AC-1).
 *
 * WHY: Provider onboarding — creating service offerings and configuring
 * the provider org — is the entry point for the entire M3 quote-to-completion
 * workflow. Without verified offerings, providers cannot receive service
 * requests from hospitals. These tests confirm the onboarding flow is
 * accessible and the offerings management page renders correctly.
 *
 * Covers:
 * - AC-1: Provider onboarding — create provider org, add service offerings
 * - Provider auth session grants access to /provider/offerings
 * - The offerings list container is present (data-testid="offering-list")
 * - New offering form is accessible at /provider/offerings/new
 *
 * Uses the providerPage auth fixture (pre-authenticated via global-setup).
 *
 * vi: "Kiểm tra giới thiệu nhà cung cấp" / en: "Provider onboarding tests"
 */
test.describe("Provider onboarding — service offerings (AC-1)", () => {
  /**
   * Test: Provider user can view the service offerings page.
   *
   * WHY: Verifies the offerings page renders with the correct Vietnamese heading
   * and offering list container. Confirms the provider auth session (loaded from
   * storageState) grants access to the provider portal and that the Convex
   * useProviderOfferings query does not error for the authenticated user.
   */
  test("provider user can view service offerings page", async ({
    providerPage,
  }) => {
    const offeringsPage = new ProviderOfferingsPage(providerPage);
    await offeringsPage.goto();

    // Page should be accessible (not redirected to sign-in)
    await expect(providerPage).toHaveURL(/\/provider\/offerings/, {
      timeout: 15000,
    });

    // The offering list container must be present (even when empty)
    // WHY: data-testid="offering-list" is required by downstream E2E tests
    // to click into offerings and verify add/edit flows.
    await expect(offeringsPage.list).toBeVisible({ timeout: 10000 });

    // Page heading should display in Vietnamese (primary language)
    // "Quản lý Dịch vụ" = "Service Management"
    await expect(offeringsPage.heading).toContainText("Quản lý Dịch vụ");
  });

  /**
   * Test: Provider user can navigate to the new offering form.
   *
   * WHY: The /provider/offerings/new route is the entry point for adding
   * a new service offering (e.g., "Sửa chữa thiết bị X-quang"). Without
   * this form accessible, providers cannot onboard their service catalog.
   * Tests that the route renders a form element (data-testid="offering-form").
   */
  test("provider user can access new offering form", async ({
    providerPage,
  }) => {
    await providerPage.goto("/provider/offerings/new");

    await expect(providerPage).toHaveURL(/\/provider\/offerings\/new/, {
      timeout: 15000,
    });

    // The form should be present (required for provider to add offerings)
    await expect(
      providerPage.locator('[data-testid="offering-form"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test: Provider cannot access hospital portal routes.
   *
   * WHY: Cross-portal isolation is a critical security requirement.
   * A provider session attempting to navigate to /hospital/* routes must be
   * redirected away. This guards against role escalation via URL manipulation.
   */
  test("provider session cannot access hospital portal", async ({
    providerPage,
  }) => {
    // Navigate to offerings first (confirms session is active)
    const offeringsPage = new ProviderOfferingsPage(providerPage);
    await offeringsPage.goto();
    await expect(providerPage).toHaveURL(/\/provider\/offerings/, {
      timeout: 15000,
    });

    // Attempt to access hospital route — must be redirected
    await providerPage.goto("/hospital/equipment");
    await expect(providerPage).not.toHaveURL(/\/hospital\/equipment/, {
      timeout: 10000,
    });
  });
});
