import type { Page } from "@playwright/test";

/**
 * Page Object Model for the provider analytics/dashboard page.
 * Route: /provider/dashboard (contains analytics stats) or /provider/analytics
 *
 * WHY: Encapsulates selectors for analytics data visible to providers —
 * quote win rate, service completion stats, and rating summaries.
 * Used by E2E tests to verify that providers see their performance metrics
 * after hospitals rate completed services.
 *
 * NOTE: As of M3-5, the dedicated analytics page (/provider/analytics) is
 * planned for M3-4 (#69). These selectors target the dashboard stats cards
 * currently available, plus placeholders for the future analytics page.
 *
 * vi: "Phân tích nhà cung cấp" / en: "Provider analytics"
 */
export class ProviderAnalyticsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    // Attempt to navigate to dedicated analytics page first;
    // fall back to dashboard which contains summary stats.
    await this.page.goto("/provider/dashboard");
  }

  async gotoAnalytics(): Promise<void> {
    await this.page.goto("/provider/analytics");
  }

  /** Page heading (h1) — "Tổng quan" on dashboard or analytics-specific heading */
  get heading() {
    return this.page.locator("h1");
  }

  /** Quote stats container on dashboard (shows offering count + pending quotes) */
  get dashboardStats() {
    return this.page.locator('[data-testid="dashboard-stats"]');
  }

  /** Provider quotes list page analytics container */
  get quotesListContainer() {
    return this.page.locator('[data-testid="provider-quotes-list"]');
  }

  /**
   * Stats cards visible on the quotes list page (quote dashboard stats).
   * data-testid="quote-stats" — rendered by QuoteDashboardStats component.
   */
  get quoteStats() {
    return this.page.locator('[data-testid="quote-stats"]');
  }

  /**
   * Rating display element (data-testid="provider-rating").
   * NOTE: Rating display is planned in M3-4 (#69). Will be populated once
   * the provider analytics feature lands.
   */
  get ratingDisplay() {
    return this.page.locator('[data-testid="provider-rating"]');
  }
}
