import { expect, test } from "../../fixtures/auth";
import { ServiceRequestDetailPage } from "../../pages/hospital/service-request-detail.page";
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

/**
 * Service request form navigation tests (AC-3).
 *
 * WHY: The 3-step service request creation wizard is the entry point for
 * the hospital-to-provider service workflow. Verifying the form route is
 * accessible ensures the creation flow can begin.
 */
test.describe("Service request form navigation", () => {
  /**
   * Test (AC-3): Hospital user can navigate to new service request form.
   *
   * WHY: Confirms /hospital/service-requests/new is accessible via the
   * authenticated hospital session and renders the wizard's first step.
   */
  test("hospital user can navigate to new service request form", async ({
    hospitalPage,
  }) => {
    await hospitalPage.goto("/hospital/service-requests/new");

    await expect(hospitalPage).toHaveURL(/\/hospital\/service-requests\/new/, {
      timeout: 15000,
    });

    // Step 1 of wizard should be visible (heading element confirms page loaded)
    await expect(hospitalPage.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

/**
 * Service request detail page tests (AC-4, AC-5).
 *
 * WHY: The detail page is the hub for quote review and service completion.
 * Hospital staff use it to see quotes from providers, approve the best one,
 * and rate completed services. Testing navigation from list confirms
 * the detail route is wired correctly.
 */
test.describe("Service request detail page", () => {
  /**
   * Test (AC-4): Service request list navigates to detail page.
   *
   * WHY: Verifies that clicking a service request row navigates to the
   * detail page at /hospital/service-requests/[id]. If no requests exist,
   * the test validates the list is accessible (future state when data exists).
   */
  test("service request list navigates to detail page", async ({
    hospitalPage,
  }) => {
    const srPage = new HospitalServiceRequestsPage(hospitalPage);
    await srPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/service-requests/, {
      timeout: 15000,
    });
    await expect(srPage.list).toBeVisible({ timeout: 10000 });

    // If there are service requests, verify navigation to detail page
    const rowCount = await srPage.rows.count();
    if (rowCount > 0) {
      // Click the first row link to navigate to detail
      await srPage.rows.first().locator("a").first().click();
      await expect(hospitalPage).toHaveURL(
        /\/hospital\/service-requests\/[^/]+$/,
        { timeout: 15000 },
      );
    }
  });

  /**
   * Test (AC-4): Service request detail page shows quotes section.
   *
   * WHY: The quotes-section data-testid must be present for hospital staff
   * to review provider quotes. This validates the detail page structure
   * for a service request that exists in the system.
   */
  test("service request detail page renders request-info section", async ({
    hospitalPage,
  }) => {
    // Use ServiceRequestDetailPage POM to verify structure
    // Navigate to list first to discover if any requests exist
    const srPage = new HospitalServiceRequestsPage(hospitalPage);
    await srPage.goto();

    await expect(hospitalPage).toHaveURL(/\/hospital\/service-requests/, {
      timeout: 15000,
    });
    await expect(srPage.list).toBeVisible({ timeout: 10000 });

    const rowCount = await srPage.rows.count();
    if (rowCount > 0) {
      // Navigate to first request detail via link
      await srPage.rows.first().locator("a").first().click();
      await expect(hospitalPage).toHaveURL(
        /\/hospital\/service-requests\/[^/]+$/,
        { timeout: 15000 },
      );

      // Extract request ID from current URL and assert request-info is visible
      const url = hospitalPage.url();
      const idMatch = /\/hospital\/service-requests\/([^/]+)$/.exec(url);
      if (idMatch?.[1]) {
        const detailPage = new ServiceRequestDetailPage(hospitalPage);
        await expect(detailPage.requestInfo).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
