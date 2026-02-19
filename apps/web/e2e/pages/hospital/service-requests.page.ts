import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hospital service requests page (/hospital/service-requests).
 *
 * WHY: Encapsulates data-testid selectors for service request list assertions.
 * Used by Wave 5 service request tests to verify requests appear in the list.
 */
export class HospitalServiceRequestsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/hospital/service-requests");
  }

  /** The service request list table (always rendered, even when empty) */
  get list() {
    return this.page.locator('[data-testid="service-request-list"]');
  }

  /** Service request rows (tr elements with data-testid="service-request-row") */
  get rows() {
    return this.page.locator('[data-testid="service-request-row"]');
  }

  /** Status badge elements within service request rows */
  get statusBadges() {
    return this.page.locator('[data-testid="status-badge"]');
  }
}
