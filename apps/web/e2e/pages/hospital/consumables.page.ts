import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hospital consumables list page (/hospital/consumables).
 *
 * WHY: Encapsulates data-testid selectors for consumables list assertions.
 * Follows the equipment.page.ts POM pattern for consistency.
 * Used by consumables E2E tests to verify the list renders correctly.
 */
export class ConsumablesListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/hospital/consumables");
  }

  /** The consumables list table (always rendered, even when empty) */
  get list() {
    return this.page.locator('[data-testid="consumables-list"]');
  }

  /** Consumable rows (tr elements with data-testid="consumable-row") */
  get rows() {
    return this.page.locator('[data-testid="consumable-row"]');
  }

  /** Stock status badges within consumable rows */
  get statusBadges() {
    return this.page.locator('[data-testid="stock-badge"]');
  }

  /** Empty state message when no consumables exist */
  get emptyState() {
    return this.page.locator('[data-testid="consumables-empty"]');
  }

  /** Usage log table on detail page */
  get usageLog() {
    return this.page.locator('[data-testid="usage-log"]');
  }
}
