import type { Page } from "@playwright/test";

/**
 * Page Object Model for the provider offerings page (/provider/offerings).
 *
 * WHY: Encapsulates data-testid selectors for offering list assertions.
 * Used by E2E smoke tests to verify the offerings page loads correctly for
 * an authenticated provider user.
 */
export class ProviderOfferingsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/provider/offerings");
  }

  /** The offerings list container (data-testid="offering-list") */
  get list() {
    return this.page.locator('[data-testid="offering-list"]');
  }

  /** The page heading (h1) */
  get heading() {
    return this.page.locator("h1");
  }
}
