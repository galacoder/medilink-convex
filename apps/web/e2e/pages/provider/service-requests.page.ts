import { type Page } from "@playwright/test";

/**
 * Page Object Model for the provider service requests page (/provider/service-requests).
 *
 * WHY: Encapsulates data-testid selectors for provider request list assertions.
 * Used by Wave 5 provider quote tests to verify requests are visible to providers.
 */
export class ProviderServiceRequestsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/provider/service-requests");
  }

  /** The provider request list table (always rendered, even when empty) */
  get list() {
    return this.page.locator('[data-testid="provider-request-list"]');
  }

  /** Provider request rows (tr elements with data-testid="provider-request-row") */
  get rows() {
    return this.page.locator('[data-testid="provider-request-row"]');
  }
}
