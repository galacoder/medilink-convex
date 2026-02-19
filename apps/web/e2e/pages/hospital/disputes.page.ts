import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hospital disputes page (/hospital/disputes).
 *
 * WHY: Placeholder POM matching the nav-config.ts href for /hospital/disputes.
 * The disputes UI (page.tsx) has not been implemented yet (M2-5 pending).
 * This file must exist so dispute test files can import it without compile errors.
 *
 * TODO: Implement selectors when M2-5 disputes UI is merged.
 * Reference: Issue #64 (M2-5 Dispute Resolution — Hospital Portal)
 *
 * vi: "Trang khiếu nại bệnh viện" / en: "Hospital disputes page"
 */
export class DisputesPage {
  constructor(private readonly page: Page) {}

  /**
   * Navigate to disputes page.
   * TODO: Disputes page not yet implemented (/hospital/disputes/page.tsx missing).
   */
  async goto(): Promise<void> {
    await this.page.goto("/hospital/disputes");
  }

  /** Disputes list container (pending M2-5 implementation) */
  get list() {
    return this.page.locator('[data-testid="disputes-list"]');
  }

  /** Individual dispute rows */
  get rows() {
    return this.page.locator('[data-testid="dispute-row"]');
  }

  /** Dispute status badge */
  get statusBadges() {
    return this.page.locator('[data-testid="dispute-status"]');
  }
}
