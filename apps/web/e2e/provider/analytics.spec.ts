import { expect, test } from "../fixtures/provider";
import { ProviderAnalyticsPage } from "../pages/provider/analytics.page";
import { ProviderQuotesPage } from "../pages/provider/quotes.page";

/**
 * Provider analytics data visibility E2E tests (M3-5 AC-7).
 *
 * WHY: After hospitals rate completed services, providers need to see their
 * performance analytics — win rate, average rating, service completion stats.
 * Without analytics visibility, providers cannot improve their service quality
 * or understand their standing on the platform.
 *
 * Covers:
 * - AC-7: Receive rating — hospital rates service, provider sees rating in analytics
 *
 * IMPORTANT NOTE: Tests for provider analytics depend on M3-4 (#69 — Provider
 * Analytics feature). As of M3-5 implementation, issue #69 is being developed
 * in parallel and may not be merged to main yet.
 *
 * Tests marked with test.skip are PENDING M3-4 (#69) merge:
 * - The /provider/analytics dedicated page may not exist yet
 * - Rating display on the dashboard requires M3-4 analytics component
 *
 * Available now (not skipped):
 * - Dashboard page renders correctly with session data
 * - Provider quotes list shows win rate stats (QuoteDashboardStats)
 *
 * Selectors to update when #69 lands:
 * - data-testid="provider-rating" (average rating display)
 * - data-testid="analytics-overview" (analytics overview section)
 * - data-testid="rating-breakdown" (service quality / timeliness / professionalism)
 *
 * vi: "Kiểm tra phân tích nhà cung cấp" / en: "Provider analytics tests"
 */

/**
 * Test suite: Provider dashboard — available analytics (AC-7 pre-conditions).
 *
 * WHY: The provider dashboard currently shows offering count and quote stats.
 * These tests verify the existing analytics surface (dashboard page + quotes
 * stats) renders correctly before the dedicated analytics page lands in #69.
 */
test.describe("Provider dashboard analytics (AC-7 pre-conditions)", () => {
  /**
   * Test (AC-7 infra): Provider dashboard renders with session context.
   *
   * WHY: The dashboard is the primary analytics entry point. It must render
   * the provider's name, org name, and offering count. This confirms the
   * Convex session queries (useSession, useActiveOrganization) work correctly.
   */
  test("provider dashboard renders with account information", async ({
    providerPage,
  }) => {
    const analyticsPage = new ProviderAnalyticsPage(providerPage);
    await analyticsPage.goto();

    await expect(providerPage).toHaveURL(/\/provider\/dashboard/, {
      timeout: 15000,
    });

    // Page heading: "Tổng quan" = "Dashboard" / "Overview" (Vietnamese)
    await expect(analyticsPage.heading).toContainText("Tổng quan");

    // Session card must be visible (shows user name, org, role)
    // WHY: If the session card is missing, the Convex auth adapter is broken
    await expect(providerPage.locator("text=Thông tin tài khoản")).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test (AC-7 infra): Provider quotes list shows dashboard stats.
   *
   * WHY: The QuoteDashboardStats component on /provider/quotes shows aggregate
   * quote metrics (total, pending, accepted, win rate). This is the closest
   * analytics surface available before M3-4 (#69) lands. Verifying it renders
   * confirms the useProviderQuotes hook and stats computation work.
   */
  test("provider quotes page renders quote statistics", async ({
    providerPage,
  }) => {
    const quotesPage = new ProviderQuotesPage(providerPage);
    await quotesPage.goto();

    await expect(providerPage).toHaveURL(/\/provider\/quotes/, {
      timeout: 15000,
    });

    // Quotes list container must be present
    await expect(quotesPage.list).toBeVisible({ timeout: 10000 });

    // Status tabs must be present (Tất cả / Đang chờ / Đã chấp nhận / Đã từ chối)
    // WHY: Tabs are how providers filter quotes by approval status
    await expect(providerPage.locator('[role="tablist"]')).toBeVisible({
      timeout: 10000,
    });
  });
});

/**
 * Test suite: Receive rating — provider sees rating in analytics (AC-7 — PENDING M3-4 #69).
 *
 * WHY: After a hospital rates a completed service, the provider must see this
 * rating in their analytics view. The rating (1-5 stars) and sub-scores
 * (service quality, timeliness, professionalism) help providers understand
 * hospital satisfaction.
 *
 * TODO: Remove test.skip annotations when M3-4 (#69) is merged to main.
 * Update selectors to match actual data-testid values from M3-4 implementation.
 */
test.describe("Receive rating — analytics visibility (AC-7) — PENDING M3-4 #69", () => {
  /**
   * Test (AC-7): Provider can access dedicated analytics page.
   *
   * SKIP REASON: Requires M3-4 (#69) provider analytics feature.
   * The /provider/analytics route is planned for M3-4 which adds a dedicated
   * analytics page with rating breakdown and performance trends.
   *
   * WHY THIS TEST: Providers need a dedicated analytics view (separate from
   * the dashboard) to see detailed rating breakdowns, historical trends, and
   * comparison with other providers on the platform.
   *
   * TODO when #69 merges:
   * 1. Remove test.skip
   * 2. Navigate to /provider/analytics
   * 3. Assert data-testid="analytics-overview" is visible
   * 4. Assert heading contains "Phân tích" (Analytics in Vietnamese)
   */
  test.skip("provider can access dedicated analytics page", async ({
    providerPage,
  }) => {
    const analyticsPage = new ProviderAnalyticsPage(providerPage);
    await analyticsPage.gotoAnalytics();

    await expect(providerPage).toHaveURL(/\/provider\/analytics/, {
      timeout: 15000,
    });

    // Analytics overview section (added by M3-4)
    await expect(
      providerPage.locator('[data-testid="analytics-overview"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test (AC-7): Provider sees hospital rating in analytics after service completion.
   *
   * SKIP REASON: Requires M3-4 (#69) provider analytics + rating display feature.
   * The rating display component (data-testid="provider-rating") is implemented
   * in M3-4. Also requires M3-3 (#68) for service completion to enable ratings.
   *
   * WHY THIS TEST: After a hospital submits a rating for a completed service
   * (via ServiceRatingForm), the provider's analytics page must update in
   * real-time (Convex subscription) to show the new rating. This validates
   * the full rating loop: hospital rates -> Convex mutation -> provider sees rating.
   *
   * Cross-actor test flow:
   * 1. Provider completes a service (M3-3 required)
   * 2. Hospital submits rating via ServiceRatingForm
   * 3. Provider navigates to analytics -> sees rating update
   *
   * TODO when #68 + #69 merge:
   * 1. Remove test.skip
   * 2. Set up completed service in beforeAll
   * 3. Have hospital session submit rating
   * 4. Verify provider analytics shows the rating without page refresh
   */
  test.skip("provider sees rating after hospital rates completed service", async ({
    providerPage,
    hospitalPage,
  }) => {
    // Step 1: Provider goes to analytics page
    await providerPage.goto("/provider/analytics");
    await expect(providerPage).toHaveURL(/\/provider\/analytics/, {
      timeout: 15000,
    });

    // Step 2: Get current rating count baseline
    const ratingDisplay = providerPage.locator(
      '[data-testid="provider-rating"]',
    );
    await expect(ratingDisplay).toBeVisible({ timeout: 10000 });

    // Step 3: Hospital submits a rating for a completed service
    // (Navigate hospital session to a completed service detail)
    await hospitalPage.goto("/hospital/service-requests");
    // Find a completed service request and submit rating
    const completedRow = hospitalPage.locator(
      '[data-testid="service-request-row"][data-status="completed"]',
    );
    const rowCount = await completedRow.count();
    if (rowCount > 0) {
      await completedRow.first().click();

      // Submit rating form
      const ratingForm = hospitalPage.locator(
        '[data-testid="service-rating-form"]',
      );
      await expect(ratingForm).toBeVisible({ timeout: 10000 });
      await hospitalPage.locator('[data-testid="rating-5-star"]').click();
      await hospitalPage
        .locator('[data-testid="submit-rating-button"]')
        .click();

      // Step 4: Provider analytics should update (Convex real-time)
      // No page refresh needed — Convex subscription surfaces the update
      await expect(ratingDisplay).toBeVisible({ timeout: 15000 });
    }
  });

  /**
   * Test (AC-7): Provider analytics show rating breakdown by category.
   *
   * SKIP REASON: Requires M3-4 (#69) provider analytics feature.
   * Rating breakdown by category (service quality, timeliness, professionalism)
   * is planned as part of the M3-4 analytics dashboard.
   *
   * WHY THIS TEST: Sub-category ratings help providers identify where to
   * improve. Service quality tracks technical work, timeliness tracks
   * adherence to schedule, professionalism tracks communication.
   *
   * TODO when #69 merges:
   * 1. Remove test.skip
   * 2. Navigate to /provider/analytics
   * 3. Assert data-testid="rating-breakdown" is visible
   * 4. Assert sub-scores for quality, timeliness, professionalism are shown
   */
  test.skip("provider analytics shows rating breakdown by category", async ({
    providerPage,
  }) => {
    await providerPage.goto("/provider/analytics");

    // Rating breakdown section (added by M3-4)
    const ratingBreakdown = providerPage.locator(
      '[data-testid="rating-breakdown"]',
    );
    await expect(ratingBreakdown).toBeVisible({ timeout: 10000 });

    // Sub-scores should be visible
    await expect(
      providerPage.locator('[data-testid="quality-score"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      providerPage.locator('[data-testid="timeliness-score"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      providerPage.locator('[data-testid="professionalism-score"]'),
    ).toBeVisible({ timeout: 5000 });
  });
});
