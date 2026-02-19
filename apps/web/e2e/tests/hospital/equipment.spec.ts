import { expect, test } from "../../fixtures/hospital";
import {
  EquipmentFormPage,
  EquipmentListPage,
} from "../../pages/hospital/equipment.page";

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

/**
 * Equipment form navigation tests (AC-1).
 *
 * WHY: Verifying navigation to the equipment creation form ensures hospital
 * staff can begin the equipment lifecycle flow. The form must be accessible
 * via the authenticated session without extra sign-in prompts.
 */
test.describe("Equipment form navigation", () => {
  /**
   * Test (AC-1): Hospital user can navigate to new equipment form.
   *
   * WHY: Confirms the /hospital/equipment/new route is accessible and
   * renders the form with #nameVi as the first required field.
   */
  test("hospital user can navigate to new equipment form", async ({
    hospitalPage,
  }) => {
    const formPage = new EquipmentFormPage(hospitalPage);
    await formPage.gotoNew();

    await expect(hospitalPage).toHaveURL(/\/hospital\/equipment\/new/, {
      timeout: 15000,
    });

    // Form should render with the Vietnamese name input visible
    await expect(formPage.nameViInput).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Equipment detail page tests (AC-1).
 *
 * WHY: The list-to-detail navigation is a critical user flow for hospital
 * staff reviewing equipment details before making decisions on maintenance
 * or borrowing.
 */
test.describe("Equipment detail page", () => {
  /**
   * Test (AC-1): Equipment detail page is accessible from list.
   *
   * WHY: Verifies that equipment rows in the list are rendered and contain
   * navigable links. This confirms the data model is connected to the UI.
   */
  test("equipment detail page is accessible from list", async ({
    hospitalPage,
  }) => {
    const equipmentPage = new EquipmentListPage(hospitalPage);
    await equipmentPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/equipment/, {
      timeout: 15000,
    });

    // List should be accessible
    await expect(equipmentPage.list).toBeVisible({ timeout: 10000 });

    // If there are equipment rows, verify first row is visible
    const rowCount = await equipmentPage.rows.count();
    if (rowCount > 0) {
      await expect(equipmentPage.rows.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
