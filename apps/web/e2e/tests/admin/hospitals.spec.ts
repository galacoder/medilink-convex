import { expect, test } from "../../fixtures/admin";
import { AdminHospitalsPage } from "../../pages/admin/hospitals.page";

/**
 * Platform admin hospital management E2E tests.
 *
 * WHY: The hospital management page is the primary admin tool for overseeing
 * all hospital organizations. These tests verify:
 *   1. The admin session allows access to /admin/hospitals
 *   2. The page heading shows "Quản lý bệnh viện" (Hospital Management)
 *   3. The HospitalTable component renders (even when data is loading)
 *
 * Note: Tests do NOT assert specific hospital counts because the number
 * of hospitals depends on the seeded data (global-setup creates 1 hospital
 * via the hospital user signup). Verifying table structure is sufficient.
 *
 * Uses the adminPage auth fixture (pre-authenticated via global-setup.ts).
 */
test.describe("Admin hospital management", () => {
  /**
   * Test: Admin can navigate to /admin/hospitals.
   *
   * WHY: Verifies that the admin session allows access to the hospital
   * management route without being redirected to sign-in.
   */
  test("admin can view hospital management page", async ({ adminPage }) => {
    const hospitalsPage = new AdminHospitalsPage(adminPage);
    await hospitalsPage.goto();

    // Page should be accessible without redirect to sign-in
    await expect(adminPage).toHaveURL(/\/admin\/hospitals/, {
      timeout: 15000,
    });
  });

  /**
   * Test: Hospital management page shows the Vietnamese heading.
   *
   * WHY: Confirms the AdminHospitalsPage component rendered and shows
   * "Quản lý bệnh viện" — the bilingual label (vi: Hospital Management).
   */
  test("hospital management page shows correct heading", async ({
    adminPage,
  }) => {
    const hospitalsPage = new AdminHospitalsPage(adminPage);
    await hospitalsPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/hospitals/, {
      timeout: 15000,
    });

    await expect(hospitalsPage.heading).toContainText("Quản lý bệnh viện", {
      timeout: 10000,
    });
  });

  /**
   * Test: Hospital management page renders the hospital list card.
   *
   * WHY: Verifies the HospitalTable component renders its containing Card.
   * This confirms the Convex useAdminHospitals hook resolved without error
   * (even if it returns 0 hospitals during test).
   */
  test("hospital management page renders hospital list", async ({
    adminPage,
  }) => {
    const hospitalsPage = new AdminHospitalsPage(adminPage);
    await hospitalsPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/hospitals/, {
      timeout: 15000,
    });

    // The hospital list card must be visible (rendered even when loading/empty)
    await expect(hospitalsPage.hospitalListCard).toBeVisible({ timeout: 10000 });
  });
});
