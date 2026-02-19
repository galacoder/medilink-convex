import { expect, test } from "../../fixtures/auth";
import { EquipmentListPage } from "../../pages/hospital/equipment.page";

/**
 * Hospital equipment list E2E tests (REQ-004).
 *
 * WHY: The equipment list page is the primary UI for hospital staff to track
 * medical equipment. These tests verify the page loads correctly and the list
 * container is always visible (even when empty) for reliable test assertions.
 *
 * Uses the hospitalPage auth fixture (pre-authenticated via global-setup)
 * to avoid repeating the sign-up flow.
 */
test.describe("Equipment list", () => {
  /**
   * Test (REQ-004): Hospital user can view equipment list page.
   *
   * WHY: Verifying the page renders and the list container is visible confirms
   * that:
   * 1. The auth fixture session state is valid (middleware allows access)
   * 2. The page component renders without errors
   * 3. The data-testid="equipment-list" container is present for future data assertions
   */
  test("hospital user can view equipment list page", async ({
    hospitalPage,
  }) => {
    const equipmentPage = new EquipmentListPage(hospitalPage);
    await equipmentPage.goto();

    // Page should be accessible (not redirected to sign-in)
    await expect(hospitalPage).toHaveURL(/\/hospital\/equipment/, {
      timeout: 15000,
    });

    // The equipment list table should always be visible (scaffold page renders it even when empty)
    await expect(equipmentPage.list).toBeVisible({ timeout: 10000 });

    // Page heading should display the equipment title in Vietnamese
    await expect(hospitalPage.locator("h1")).toContainText("Thiết bị y tế");
  });
});
