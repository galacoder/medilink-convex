import type { Page } from "@playwright/test";

/**
 * Page Object Model for the provider quotes page (/provider/service-requests).
 *
 * WHY: Encapsulates selectors for the provider-side quote submission flow.
 * Providers view hospital service requests and submit price quotes for
 * equipment repair/maintenance services.
 *
 * vi: "Trang báo giá nhà cung cấp" / en: "Provider quotes page"
 */
export class ProviderQuotesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/provider/service-requests");
  }

  /** Provider request list container (always rendered) */
  get list() {
    return this.page.locator('[data-testid="provider-request-list"]');
  }

  /** Individual provider request rows */
  get rows() {
    return this.page.locator('[data-testid="provider-request-row"]');
  }
}
