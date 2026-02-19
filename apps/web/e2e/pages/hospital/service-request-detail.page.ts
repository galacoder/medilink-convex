import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hospital service request detail page
 * (/hospital/service-requests/[id]).
 *
 * WHY: Encapsulates data-testid selectors for service request detail
 * assertions. The detail page shows request-info, quotes-section, and
 * rating-section which are the key data areas for quote review and
 * service completion tests.
 *
 * vi: "Trang chi tiết yêu cầu dịch vụ" / en: "Service request detail page"
 */
export class ServiceRequestDetailPage {
  constructor(private readonly page: Page) {}

  async goto(id: string): Promise<void> {
    await this.page.goto(`/hospital/service-requests/${id}`);
  }

  /** Request info card (always rendered) -- shows status, priority, equipment name */
  get requestInfo() {
    return this.page.locator('[data-testid="request-info"]');
  }

  /** Quotes section -- shows list of provider quotes for review */
  get quotesSection() {
    return this.page.locator('[data-testid="quotes-section"]');
  }

  /** Rating section -- shows after service completion for hospital to rate */
  get ratingSection() {
    return this.page.locator('[data-testid="rating-section"]');
  }

  /** Status badge -- shows current request status (open, in_progress, completed) */
  get statusBadge() {
    return this.page.locator('[data-testid="status-badge"]').first();
  }
}
