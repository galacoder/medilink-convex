import { expect, test } from "@playwright/test";

/**
 * Multi-tenancy isolation E2E tests (M2-6 AC-8).
 *
 * WHY: Hospital organizations must be completely isolated from each other.
 * Hospital A staff should never see Hospital B's equipment, service requests,
 * or consumables. This is a critical security assertion for the SPMET
 * multi-tenant architecture where multiple healthcare institutions share
 * the platform but must have zero data visibility into each other's records.
 *
 * Convex enforces isolation via organizationId field on all data records.
 * These tests verify that isolation is reflected in the UI.
 *
 * NOTE: This file intentionally imports directly from @playwright/test (not
 * fixtures/auth) because it creates a second browser context for a different
 * hospital organization -- the auth fixture only provides the first hospital's
 * pre-authenticated session.
 *
 * vi: "Kiểm tra cách ly đa thuê" / en: "Multi-tenancy isolation tests"
 */
test.describe("Multi-tenancy isolation", () => {
  /**
   * Test (AC-8): Second hospital cannot see first hospital equipment.
   *
   * WHY: Verifies org-scoped data access — Convex queries filter by organizationId.
   * A user from Hospital B navigating to /hospital/equipment should see only
   * Hospital B's equipment (empty list for a newly registered org), not the
   * equipment that belongs to Hospital A (the global-setup hospital).
   *
   * This is a negative test: we assert rowCount === 0 for a brand-new org.
   *
   * vi: "Bệnh viện thứ hai không thể xem thiết bị bệnh viện thứ nhất"
   * en: "Second hospital cannot see first hospital equipment"
   */
  test(
    "second hospital user cannot see first hospital equipment",
    async ({ browser }) => {
      const timestamp = Date.now();

      // Create a second hospital user (different org from global-setup hospital)
      const secondHospitalUser = {
        name: "Second Hospital Staff",
        email: `hospital-b-${timestamp}@test.medilink.com`,
        password: "TestPassword@123",
        orgName: `Second Hospital Org ${timestamp}`,
      };

      const secondContext = await browser.newContext();
      const secondPage = await secondContext.newPage();

      try {
        // Sign up second hospital user with a new organization
        // WHY: Using relative path so playwright baseURL config applies
        await secondPage.goto("/sign-up");
        await secondPage.fill("#name", secondHospitalUser.name);
        await secondPage.fill("#email", secondHospitalUser.email);
        await secondPage.fill("#password", secondHospitalUser.password);

        // Select hospital role
        await secondPage.click("#hospital");

        // Fill organization name for new org creation
        await secondPage.fill("#orgName", secondHospitalUser.orgName);

        await secondPage.click('button[type="submit"]');

        // Wait for redirect to second hospital's dashboard
        await secondPage.waitForURL("**/hospital/dashboard", {
          timeout: 20000,
        });

        // Navigate to equipment list — should show empty list for new org
        await secondPage.goto("/hospital/equipment");
        await expect(secondPage).toHaveURL(/\/hospital\/equipment/, {
          timeout: 15000,
        });

        // The equipment list container should be visible (even if empty)
        await expect(
          secondPage.locator('[data-testid="equipment-list"]'),
        ).toBeVisible({ timeout: 10000 });

        // CRITICAL SECURITY ASSERTION: Second hospital should see 0 equipment rows.
        // All equipment belongs to the first hospital org (created in global-setup).
        // If any rows appear, multi-tenancy isolation is BROKEN.
        const rowCount = await secondPage
          .locator('[data-testid="equipment-row"]')
          .count();
        expect(rowCount).toBe(0);
      } finally {
        // Always clean up the second browser context
        await secondContext.close();
      }
    },
  );
});
