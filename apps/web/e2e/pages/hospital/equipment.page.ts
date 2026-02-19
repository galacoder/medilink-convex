import type {Page} from "@playwright/test";

/**
 * Page Object Model for the hospital equipment list page (/hospital/equipment).
 *
 * WHY: Encapsulates data-testid selectors for equipment list assertions.
 * Used by Wave 5 equipment tests to verify equipment appears in the list.
 */
export class EquipmentListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/hospital/equipment");
  }

  /** The equipment list table (always rendered, even when empty) */
  get list() {
    return this.page.locator('[data-testid="equipment-list"]');
  }

  /** Equipment rows (tr elements with data-testid="equipment-row") */
  get rows() {
    return this.page.locator('[data-testid="equipment-row"]');
  }

  /** Status badges within equipment rows */
  get statusBadges() {
    return this.page.locator('[data-testid="status-badge"]');
  }

  /** Empty state message when no equipment exists */
  get emptyState() {
    return this.page.locator('[data-testid="equipment-empty"]');
  }
}
