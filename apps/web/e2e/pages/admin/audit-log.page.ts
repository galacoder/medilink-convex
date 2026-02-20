import type { Page } from "@playwright/test";

/**
 * Page Object Model for the platform admin audit log page (/admin/audit-log).
 *
 * WHY: Encapsulates selectors for the cross-tenant audit trail viewer.
 * Platform admins use this page to investigate security incidents and verify
 * compliance with Vietnamese medical device regulations (5-year retention).
 *
 * The page renders an AuditLogTable component with Convex real-time data.
 * Tests verify page structure without asserting specific entry counts.
 */
export class AdminAuditLogPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/audit-log");
  }

  /**
   * h1 heading: "Nhật ký kiểm tra" (Audit Log)
   * WHY: Confirms correct page rendered (not dashboard or other admin page).
   */
  get heading() {
    return this.page.locator("h1");
  }

  /**
   * Refresh action button.
   * WHY: Verifies the page action bar rendered.
   */
  get refreshButton() {
    return this.page.locator("button").filter({ hasText: /Làm mới|Refresh/ });
  }

  /**
   * Export CSV action button.
   * WHY: Verifies the export button is present (compliance feature).
   */
  get exportButton() {
    return this.page.locator("button").filter({ hasText: /Xuất CSV|Export/ });
  }

  /**
   * The audit log table container.
   * WHY: Confirms the AuditLogTable component rendered (even when empty).
   */
  get logTable() {
    return this.page.locator('table, [data-testid="audit-log-table"]').first();
  }

  /**
   * Filter panel container.
   * WHY: Verifies the AuditLogFilterPanel component is present.
   */
  get filterPanel() {
    return this.page
      .locator('[class*="filter"], form, [data-testid="audit-log-filters"]')
      .first();
  }
}
