import type { Page } from "@playwright/test";

/**
 * Page Object Model for the provider service request detail page.
 * Route: /provider/service-requests/[id]
 *
 * WHY: Encapsulates selectors for the provider's view of an individual
 * service request, including the quote submission form and the list of
 * already-submitted quotes. Used by E2E tests for the quote-to-completion
 * workflow to verify the detail page renders correctly.
 *
 * vi: "Chi tiết yêu cầu dịch vụ (nhà cung cấp)" / en: "Provider service request detail"
 */
export class ProviderServiceRequestDetailPage {
  constructor(private readonly page: Page) {}

  async goto(id: string): Promise<void> {
    await this.page.goto(`/provider/service-requests/${id}`);
  }

  /** Main detail container (data-testid="provider-request-detail") */
  get container() {
    return this.page.locator('[data-testid="provider-request-detail"]');
  }

  /** Page heading (h1) showing "Chi tiết yêu cầu dịch vụ" */
  get heading() {
    return this.page.locator("h1");
  }

  /** Quote form (data-testid="quote-form") */
  get quoteForm() {
    return this.page.locator('[data-testid="quote-form"]');
  }

  /** Amount input field (data-testid="quote-amount" or name="amount") */
  get amountInput() {
    return this.page.locator(
      '[data-testid="quote-amount"], input[name="amount"]',
    );
  }

  /** Submit quote button */
  get submitQuoteButton() {
    return this.page.locator('button[type="submit"]');
  }

  /** Submitted quotes list (data-testid="submitted-quotes") */
  get submittedQuotes() {
    return this.page.locator('[data-testid="submitted-quotes"]');
  }

  /** Individual quote cards within submitted quotes */
  get quoteCards() {
    return this.page.locator('[data-testid="submitted-quotes"] > *');
  }
}
