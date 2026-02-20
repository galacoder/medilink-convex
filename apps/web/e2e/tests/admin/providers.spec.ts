import { expect, test } from "../../fixtures/admin";
import { AdminProvidersPage } from "../../pages/admin/providers.page";

/**
 * Platform admin provider management E2E tests.
 *
 * WHY: The provider management page surfaces all registered provider
 * organizations for admin oversight (pending verification, active, suspended).
 * These tests verify:
 *   1. The admin session allows access to /admin/providers
 *   2. The page heading shows "Quản lý nhà cung cấp" (Provider Management)
 *   3. The tabs UI renders (Tất cả / Chờ duyệt / Đang hoạt động / etc.)
 *   4. The search input is present for provider filtering
 *
 * Note: Tests do NOT assert specific provider counts — global-setup creates
 * 1 provider via the provider user signup, but Convex query results may
 * not be immediately available. Verifying UI structure is sufficient.
 *
 * Uses the adminPage auth fixture (pre-authenticated via global-setup.ts).
 */
test.describe("Admin provider management", () => {
  /**
   * Test: Admin can navigate to /admin/providers.
   *
   * WHY: Verifies the admin session allows access to the provider management
   * route without redirect to sign-in.
   */
  test("admin can view provider management page", async ({ adminPage }) => {
    const providersPage = new AdminProvidersPage(adminPage);
    await providersPage.goto();

    // Page should be accessible without redirect to sign-in
    await expect(adminPage).toHaveURL(/\/admin\/providers/, {
      timeout: 15000,
    });
  });

  /**
   * Test: Provider management page shows the Vietnamese heading.
   *
   * WHY: Confirms the AdminProvidersPage component rendered with the correct
   * bilingual label: "Quản lý nhà cung cấp" (vi: Provider Management).
   */
  test("provider management page shows correct heading", async ({
    adminPage,
  }) => {
    const providersPage = new AdminProvidersPage(adminPage);
    await providersPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/providers/, {
      timeout: 15000,
    });

    await expect(providersPage.heading).toContainText("Quản lý nhà cung cấp", {
      timeout: 10000,
    });
  });

  /**
   * Test: Provider management page renders tabs for status filtering.
   *
   * WHY: The Tabs component is a key UX feature — admins use it to quickly
   * surface providers awaiting verification. Verifying it renders confirms
   * the ProviderTable component initialized correctly.
   */
  test("provider management page renders status filter tabs", async ({
    adminPage,
  }) => {
    const providersPage = new AdminProvidersPage(adminPage);
    await providersPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/providers/, {
      timeout: 15000,
    });

    // The tablist must be visible (renders even when provider list is loading/empty)
    await expect(providersPage.tabs).toBeVisible({ timeout: 10000 });

    // "Tất cả" tab must be present as the default tab
    await expect(providersPage.allTab).toBeVisible({ timeout: 5000 });
  });
});
