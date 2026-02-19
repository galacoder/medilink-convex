import { test, expect } from "../../fixtures/auth";
import { HospitalServiceRequestsPage } from "../../pages/hospital/service-requests.page";

/**
 * Hospital service requests list E2E tests (REQ-005).
 *
 * WHY: The service requests page is the primary UI for hospital staff to
 * track equipment repair/maintenance requests sent to providers. These tests
 * verify the page loads correctly and the list container is visible.
 *
 * Uses the hospitalPage auth fixture (pre-authenticated via global-setup).
 */
test.describe("Service requests list", () => {
  /**
   * Test (REQ-005): Hospital user can view service requests page.
   *
   * WHY: Verifying the page renders and the list container is visible confirms:
   * 1. Auth fixture session is valid for hospital portal access
   * 2. The page component renders without errors
   * 3. data-testid="service-request-list" is present for future data assertions
   */
  test("hospital user can view service requests list page", async ({
    hospitalPage,
  }) => {
    const srPage = new HospitalServiceRequestsPage(hospitalPage);
    await srPage.goto();

    // Page should be accessible (not redirected to sign-in)
    await expect(hospitalPage).toHaveURL(/\/hospital\/service-requests/, {
      timeout: 15000,
    });

    // The service request list table should always be visible
    await expect(srPage.list).toBeVisible({ timeout: 10000 });

    // Page heading should display the service requests title in Vietnamese
    await expect(hospitalPage.locator("h1")).toContainText("Yêu cầu dịch vụ");
  });
});
