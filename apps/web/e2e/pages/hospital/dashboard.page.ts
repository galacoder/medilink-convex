import { type Page } from "@playwright/test";

/**
 * Page Object Model for the hospital dashboard (/hospital/dashboard).
 *
 * WHY: Encapsulates selectors for the session info card displayed after sign-up.
 * Used by Wave 4 auth tests to verify the correct user/org is displayed.
 */
export class HospitalDashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/hospital/dashboard");
  }

  /** h1 with "Tổng quan" heading */
  get heading() {
    return this.page.locator("h1");
  }

  /** Welcome paragraph showing user name */
  get welcomeMessage() {
    return this.page.locator("p").filter({ hasText: "Chào mừng trở lại" });
  }

  /** The session info card containing user name, org name, role */
  get sessionCard() {
    return this.page.locator('[class*="Card"]').first();
  }
}
