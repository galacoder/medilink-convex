import { expect, test } from "@playwright/test";

import { SignUpPage } from "../../pages/sign-up.page";

/**
 * Sign-up flow E2E tests.
 *
 * WHY: Sign-up is the entry point for all users. If sign-up breaks, nothing
 * else works. These tests validate the entire auth chain end-to-end:
 *   1. Form submission
 *   2. Better Auth account creation (signUp.email)
 *   3. Organization creation (organization.create with org_type metadata)
 *   4. Session activation (organization.setActive)
 *   5. Middleware routing to correct portal dashboard
 *
 * Each test creates unique users (timestamp-based emails) to avoid conflicts
 * with global-setup users.
 */
test.describe("Sign-up flow", () => {
  /**
   * Test 1 (REQ-002): Hospital sign-up creates org and lands on hospital dashboard.
   *
   * WHY: Hospital is the primary portal type. Verifying the redirect confirms
   * org_type routing works correctly for the most common user type.
   */
  test("hospital user can sign up and land on hospital dashboard", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const signUpPage = new SignUpPage(page);

    await signUpPage.goto();
    await signUpPage.fillForm({
      name: "Hospital Test Staff",
      email: `hospital-auth-${timestamp}@test.medilink.com`,
      password: "TestPassword@123",
      orgType: "hospital",
      orgName: `SPMET Test Hospital ${timestamp}`,
    });
    await signUpPage.submit();
    await signUpPage.waitForDashboard("hospital");

    // Verify we landed on the hospital dashboard
    await expect(page).toHaveURL(/\/hospital\/dashboard/);

    // Verify the welcome heading is displayed
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Tổng quan");
  });

  /**
   * Test 2 (REQ-003): Provider sign-up creates org and lands on provider dashboard.
   *
   * WHY: Provider portal routing uses the same middleware but redirects to a
   * different dashboard. Testing both org types confirms org_type metadata
   * is correctly read and used for routing decisions.
   */
  test("provider user can sign up and land on provider dashboard", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const signUpPage = new SignUpPage(page);

    await signUpPage.goto();
    await signUpPage.fillForm({
      name: "Provider Test Staff",
      email: `provider-auth-${timestamp}@test.medilink.com`,
      password: "TestPassword@123",
      orgType: "provider",
      orgName: `Medical Equipment Co ${timestamp}`,
    });
    await signUpPage.submit();
    await signUpPage.waitForDashboard("provider");

    // Verify we landed on the provider dashboard
    await expect(page).toHaveURL(/\/provider\/dashboard/);

    // Verify the welcome heading is displayed
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Tổng quan");
  });

  /**
   * Test 3 (REQ-002 validation): Sign-up form stays on page for short password.
   *
   * WHY: HTML5 minLength=8 attribute on the password field prevents form
   * submission with passwords shorter than 8 characters. Verifying this
   * confirms the form validation constraint is in place and working.
   */
  test("shows validation constraint for short password", async ({ page }) => {
    const timestamp = Date.now();
    const signUpPage = new SignUpPage(page);

    await signUpPage.goto();
    await signUpPage.fillForm({
      name: "Test User",
      email: `validation-${timestamp}@test.medilink.com`,
      password: "short", // Less than 8 characters — minLength constraint
      orgType: "hospital",
      orgName: "Test Org",
    });
    await signUpPage.submit();

    // Should NOT redirect to dashboard — stays on sign-up due to validation
    // HTML5 minLength prevents form submission without server round-trip
    await expect(page).not.toHaveURL(/hospital\/dashboard/, { timeout: 3000 });
    await expect(page).not.toHaveURL(/provider\/dashboard/, { timeout: 3000 });
  });
});
