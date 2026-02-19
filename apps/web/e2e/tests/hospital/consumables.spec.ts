import { expect, test } from "../../fixtures/auth";
import { ConsumablesListPage } from "../../pages/hospital/consumables.page";

/**
 * Hospital consumables list E2E tests.
 *
 * WHY: The consumables list page is the primary UI for hospital staff to track
 * medical supplies. These tests verify the page loads correctly and the list
 * container is always visible (even when empty) for reliable test assertions.
 *
 * Uses the hospitalPage auth fixture (pre-authenticated via global-setup)
 * to avoid repeating the sign-up flow.
 */
test.describe("Consumables list", () => {
  /**
   * Test: Hospital user can view consumables list page.
   *
   * WHY: Verifying the page renders confirms:
   * 1. The auth fixture session state is valid
   * 2. The page component renders without errors
   * 3. The data-testid="consumables-list" container is present
   */
  test("hospital user can view consumables list page", async ({
    hospitalPage,
  }) => {
    const consumablesPage = new ConsumablesListPage(hospitalPage);
    await consumablesPage.goto();

    // Page should be accessible (not redirected to sign-in)
    await expect(hospitalPage).toHaveURL(/\/hospital\/consumables/, {
      timeout: 15000,
    });

    // The consumables list table should always be visible
    await expect(consumablesPage.list).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test: Consumables page heading shows Vietnamese title.
   *
   * WHY: Bilingual requirement - primary language is Vietnamese.
   * The heading "Vật tư tiêu hao" must be visible to confirm the correct page loaded.
   */
  test("consumables page heading shows Vietnamese title", async ({
    hospitalPage,
  }) => {
    const consumablesPage = new ConsumablesListPage(hospitalPage);
    await consumablesPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/consumables/, {
      timeout: 15000,
    });

    // Page heading should display the consumables title in Vietnamese
    await expect(hospitalPage.locator("h1")).toContainText("Vật tư tiêu hao");
  });

  /**
   * Test: Consumables list container is visible.
   *
   * WHY: The data-testid="consumables-list" is always rendered (scaffold pattern)
   * even when the list is empty, enabling future data assertions.
   */
  test("consumables list container is visible", async ({ hospitalPage }) => {
    const consumablesPage = new ConsumablesListPage(hospitalPage);
    await consumablesPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/consumables/, {
      timeout: 15000,
    });

    // List container must be present for E2E assertions
    await expect(consumablesPage.list).toBeVisible({ timeout: 10000 });
  });
});
