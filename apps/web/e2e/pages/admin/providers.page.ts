import type { Page } from "@playwright/test";

/**
 * Page Object Model for the platform admin provider management page (/admin/providers).
 *
 * WHY: Encapsulates selectors for the provider list page with tabbed status
 * filtering (all / pending_verification / active / suspended / inactive).
 * Tests verify page structure without asserting specific data counts.
 */
export class AdminProvidersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/providers");
  }

  /**
   * h1 heading: "Quản lý nhà cung cấp" (Provider Management)
   * WHY: Confirms correct page rendered.
   */
  get heading() {
    return this.page.locator("h1");
  }

  /**
   * Stats grid with 3 cards (pending, active, total).
   * WHY: Verifies the overview section renders.
   */
  get statsGrid() {
    return this.page.locator(".grid.gap-4");
  }

  /**
   * Tabs container for status filtering (Tất cả / Chờ duyệt / etc.)
   * WHY: Verifies the tabs UI renders for admin filter actions.
   */
  get tabs() {
    return this.page.locator('[role="tablist"]');
  }

  /**
   * The "Tất cả" (All) tab trigger.
   * WHY: Confirms the "all" tab is always present and selectable.
   */
  get allTab() {
    return this.page.locator('[role="tab"]').filter({ hasText: "Tất cả" });
  }

  /**
   * The search input for provider name filtering.
   * WHY: Confirms the search filter input is rendered.
   */
  get searchInput() {
    return this.page.locator('input[placeholder*="Tìm"]');
  }
}
