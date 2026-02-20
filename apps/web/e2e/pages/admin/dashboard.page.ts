import type { Page } from "@playwright/test";

/**
 * Page Object Model for the platform admin dashboard (/admin/dashboard).
 *
 * WHY: Encapsulates selectors for the admin dashboard session info card.
 * Used by Wave 5 admin E2E tests to verify the correct platformRole and
 * user information are displayed after proxy Branch 2 routing.
 *
 * The dashboard is a client component that calls useSession() to show
 * the current platform admin's name, email, and platformRole badge.
 */
export class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/dashboard");
  }

  /**
   * h1 heading: "Quản lý nền tảng" (Platform Management)
   * WHY: Verifies the page rendered the admin portal heading, confirming
   * that proxy Branch 2 routing succeeded (not a hospital/provider page).
   */
  get heading() {
    return this.page.locator("h1");
  }

  /**
   * Welcome message paragraph: "Chào mừng trở lại, [name]!"
   * WHY: Verifies the correct user name is shown in the session.
   */
  get welcomeMessage() {
    return this.page.locator("p").filter({ hasText: "Chào mừng trở lại" });
  }

  /**
   * Platform role badge span: shows "platform_admin"
   * WHY: Verifies the JWT contains platformRole and the dashboard renders it.
   * This is the key assertion that the admin setup flow worked correctly.
   */
  get platformRoleBadge() {
    return this.page
      .locator('span[class*="rounded-full"]')
      .filter({ hasText: "platform_admin" });
  }

  /**
   * Account info card container.
   * WHY: Confirms the Card component rendered (session data is loaded).
   */
  get sessionCard() {
    return this.page.locator('[class*="Card"]').first();
  }

  /**
   * Stats grid cards (3 placeholder cards: hospitals, providers, total users).
   * WHY: Verifies the platform overview section renders even before real data.
   */
  get statsCards() {
    return this.page.locator(".grid.gap-4 [class*=\"Card\"]");
  }
}
