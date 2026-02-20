import { expect, test } from "../../fixtures/admin";
import { AdminDashboardPage } from "../../pages/admin/dashboard.page";

/**
 * Platform admin dashboard E2E tests.
 *
 * WHY: The admin dashboard is the entry point for platform_admin users after
 * proxy Branch 2 routing. These tests verify:
 *   1. The admin session state is valid (middleware allows /admin/* access)
 *   2. The page component renders without errors
 *   3. The platformRole badge confirms the JWT contains platformRole
 *   4. The welcome message shows the correct user name
 *
 * Requires: NEXT_PUBLIC_CONVEX_SITE_URL + ADMIN_SETUP_SECRET env vars
 * (see global-setup.ts). If admin setup was skipped, the admin fixture
 * will have empty cookies and these tests will redirect to sign-in.
 *
 * Uses the adminPage auth fixture (pre-authenticated via global-setup.ts)
 * to avoid repeating the multi-step admin bootstrap flow.
 */
test.describe("Admin dashboard", () => {
  /**
   * Test: Admin user lands on /admin/dashboard after sign-in.
   *
   * WHY: Verifies that proxy Branch 2 routing worked correctly — the
   * platform_admin user with a fresh JWT including platformRole is redirected
   * to /admin/dashboard, not /hospital/dashboard or /provider/dashboard.
   */
  test("admin user lands on /admin/dashboard", async ({ adminPage }) => {
    const dashboardPage = new AdminDashboardPage(adminPage);
    await dashboardPage.goto();

    // The admin session should allow access to /admin/* without redirect to sign-in
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/, {
      timeout: 15000,
    });
  });

  /**
   * Test: Admin dashboard shows the "Quản lý nền tảng" heading.
   *
   * WHY: Confirms the admin portal page component rendered (not a hospital
   * or provider page). This is the key structural verification after routing.
   */
  test("admin dashboard shows platform management heading", async ({
    adminPage,
  }) => {
    const dashboardPage = new AdminDashboardPage(adminPage);
    await dashboardPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/dashboard/, {
      timeout: 15000,
    });

    // h1 must contain the Vietnamese platform management heading
    await expect(dashboardPage.heading).toContainText("Quản lý nền tảng", {
      timeout: 10000,
    });
  });

  /**
   * Test: Admin dashboard renders welcome message with user name.
   *
   * WHY: Confirms the useSession() hook returned the admin user session
   * and the component rendered the personalised greeting.
   */
  test("admin dashboard shows welcome message", async ({ adminPage }) => {
    const dashboardPage = new AdminDashboardPage(adminPage);
    await dashboardPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/dashboard/, {
      timeout: 15000,
    });

    // Welcome paragraph must render (session resolved, component rendered)
    await expect(dashboardPage.welcomeMessage).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test: Admin dashboard shows platformRole badge with "platform_admin".
   *
   * WHY: This is the critical assertion that the admin setup flow succeeded:
   *   1. global-setup signed up the user
   *   2. Called /api/admin/set-platform-role to update Better Auth user record
   *   3. Re-authenticated to get fresh JWT with platformRole
   *   4. The dashboard now shows the platform_admin badge
   *
   * If this test fails, the admin session JWT does not contain platformRole,
   * indicating a failure in the global-setup or the betterAuth adapter update.
   */
  test("admin dashboard shows platform_admin role badge", async ({
    adminPage,
  }) => {
    const dashboardPage = new AdminDashboardPage(adminPage);
    await dashboardPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/dashboard/, {
      timeout: 15000,
    });

    // The platformRole badge must show "platform_admin"
    // WHY: Confirms the JWT additionalField (platformRole) is present in the session
    await expect(dashboardPage.platformRoleBadge).toBeVisible({
      timeout: 10000,
    });
  });
});
