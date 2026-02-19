import type { Page } from "@playwright/test";

/**
 * Page Object Model for the provider dashboard (/provider/dashboard).
 *
 * WHY: Encapsulates selectors for session info card displayed after provider sign-up.
 * Used by Wave 4 auth tests to verify the correct provider user/org is displayed.
 */
export class ProviderDashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/provider/dashboard");
  }

  /** h1 with "Tổng quan" heading */
  get heading() {
    return this.page.locator("h1");
  }

  /** Welcome paragraph showing user name */
  get welcomeMessage() {
    return this.page.locator("p").filter({ hasText: "Chào mừng trở lại" });
  }
}
