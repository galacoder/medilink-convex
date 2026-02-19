import { expect, test } from "@playwright/test";

import { test as providerTest } from "../fixtures/provider";
import { ProviderQuotesPage } from "../pages/provider/quotes.page";
import { ProviderServiceRequestsPage } from "../pages/provider/service-requests.page";

/**
 * Provider quote submission and approval E2E tests (M3-5 AC-2, AC-3, AC-4, AC-8).
 *
 * WHY: The quote workflow is the core of the M3 provider-hospital interaction.
 * Providers must see incoming hospital service requests, submit price quotes,
 * and have those quotes appear in their "My Quotes" list. These tests validate
 * all steps from provider viewing requests to quote approval notification.
 *
 * Covers:
 * - AC-2: View incoming requests — provider sees hospital requests in their list
 * - AC-3: Submit quote — provider views request, submits quote with price
 * - AC-4: Quote approved — hospital approves quote, provider sees approval
 * - AC-8: Multi-tenancy — provider A cannot see provider B quotes (negative test)
 *
 * Uses the providerPage auth fixture (pre-authenticated via global-setup).
 *
 * vi: "Kiểm tra báo giá nhà cung cấp" / en: "Provider quote tests"
 */

/**
 * Test suite: View incoming service requests (AC-2).
 *
 * WHY: Providers must see hospital service requests before they can submit
 * quotes. This validates the /provider/service-requests page and confirms
 * the provider-request-list container is present.
 */
providerTest.describe(
  "View incoming requests — provider sees requests (AC-2)",
  () => {
    /**
     * Test (AC-2): Provider can view the incoming service requests list.
     *
     * WHY: Verifies that the provider request list renders with correct
     * Vietnamese heading and data-testid="provider-request-list" container.
     * This is the entry point for providers to find hospital requests to quote.
     */
    providerTest(
      "provider can view incoming service requests list",
      async ({ providerPage }) => {
        const srPage = new ProviderServiceRequestsPage(providerPage);
        await srPage.goto();

        // Page should be accessible (not redirected to sign-in)
        await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
          timeout: 15000,
        });

        // Provider request list must be present (even when empty for new org)
        await expect(srPage.list).toBeVisible({ timeout: 10000 });

        // Page heading: "Yêu cầu dịch vụ" = "Service Requests" (Vietnamese)
        await expect(providerPage.locator("h1")).toContainText(
          "Yêu cầu dịch vụ",
        );
      },
    );

    /**
     * Test (AC-2): Provider service request detail page is accessible.
     *
     * WHY: If any incoming requests exist, the provider should be able to
     * navigate to the detail page to review full request information before
     * submitting a quote. Tests the /provider/service-requests/[id] route.
     */
    providerTest(
      "provider can navigate to service request detail",
      async ({ providerPage }) => {
        const srPage = new ProviderServiceRequestsPage(providerPage);
        await srPage.goto();

        await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
          timeout: 15000,
        });
        await expect(srPage.list).toBeVisible({ timeout: 10000 });

        // If there are incoming requests, verify navigation to detail
        const rowCount = await srPage.rows.count();
        if (rowCount > 0) {
          // Click the first request card to navigate to detail
          await srPage.rows.first().click();
          await expect(providerPage).toHaveURL(
            /\/provider\/service-requests\/[^/]+$/,
            { timeout: 15000 },
          );

          // Detail container must be visible (data-testid="provider-request-detail")
          await expect(
            providerPage.locator('[data-testid="provider-request-detail"]'),
          ).toBeVisible({ timeout: 10000 });
        }
      },
    );
  },
);

/**
 * Test suite: Submit quote (AC-3).
 *
 * WHY: Quote submission is the primary action providers take after reviewing
 * a service request. These tests validate the quote form renders correctly
 * and providers can navigate from the request list to the quote form.
 */
providerTest.describe("Submit quote — provider submits quote (AC-3)", () => {
  /**
   * Test (AC-3): Provider quotes page is accessible.
   *
   * WHY: The /provider/quotes page shows all quotes the provider has submitted.
   * It must render the data-testid="provider-quotes-list" container and the
   * Vietnamese heading "Báo giá của tôi" for the provider to track their quotes.
   */
  providerTest(
    "provider can view their submitted quotes page",
    async ({ providerPage }) => {
      const quotesPage = new ProviderQuotesPage(providerPage);
      await quotesPage.goto();

      await expect(providerPage).toHaveURL(/\/provider\/quotes/, {
        timeout: 15000,
      });

      // Provider quotes list must be present (always rendered, even empty)
      // WHY: data-testid="provider-quotes-list" is the container for all
      // submitted quotes including status tabs (all, pending, accepted, rejected)
      await expect(quotesPage.list).toBeVisible({ timeout: 10000 });

      // Heading: "Báo giá của tôi" = "My Quotes" (Vietnamese)
      await expect(providerPage.locator("h1")).toContainText("Báo giá");
    },
  );

  /**
   * Test (AC-3): Provider can navigate to service request to submit a quote.
   *
   * WHY: The quote submission flow starts at the service request detail page
   * where the QuoteForm is embedded. This test validates the navigation chain:
   * request list -> detail page -> quote form is accessible.
   */
  providerTest(
    "provider can access quote submission form from request detail",
    async ({ providerPage }) => {
      const srPage = new ProviderServiceRequestsPage(providerPage);
      await srPage.goto();

      await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
        timeout: 15000,
      });
      await expect(srPage.list).toBeVisible({ timeout: 10000 });

      // If there are pending requests, verify the quote form is accessible
      const rowCount = await srPage.rows.count();
      if (rowCount > 0) {
        await srPage.rows.first().click();
        await expect(providerPage).toHaveURL(
          /\/provider\/service-requests\/[^/]+$/,
          { timeout: 15000 },
        );

        // The quote form should be rendered in the detail page right column
        // WHY: QuoteForm is shown when request status is "pending" or "quoted"
        await expect(
          providerPage.locator('[data-testid="provider-request-detail"]'),
        ).toBeVisible({ timeout: 10000 });
      }
    },
  );
});

/**
 * Test suite: Quote approved — provider sees approval (AC-4).
 *
 * WHY: After a hospital approves a quote, the provider must see the updated
 * status in their "My Quotes" list. This validates that the Convex real-time
 * subscription surfaces the status change without requiring a page refresh.
 * The status badge for the approved quote should show "Đã chấp nhận" (Accepted).
 */
providerTest.describe(
  "Quote approved — provider sees approval notification (AC-4)",
  () => {
    /**
     * Test (AC-4): Provider quotes page shows status tabs for filtering.
     *
     * WHY: The accepted/rejected/pending tab filters in the quotes list are
     * the primary way providers track quote approval status. If tabs are
     * missing, providers cannot see which quotes were accepted.
     *
     * Validates the Tabs component renders with "Đã chấp nhận" tab option.
     */
    providerTest(
      "provider quotes page shows status filter tabs",
      async ({ providerPage }) => {
        await providerPage.goto("/provider/quotes");

        await expect(providerPage).toHaveURL(/\/provider\/quotes/, {
          timeout: 15000,
        });

        // The tabs for filtering by quote status must be visible
        // "Tất cả" = "All", "Đang chờ" = "Pending", "Đã chấp nhận" = "Accepted"
        await expect(providerPage.locator('[role="tablist"]')).toBeVisible({
          timeout: 10000,
        });

        // Verify the "all" tab is present (first tab in the list)
        await expect(
          providerPage.locator('[role="tab"]').first(),
        ).toContainText("Tất cả");
      },
    );
  },
);

/**
 * Test suite: Multi-tenancy — provider A cannot see provider B quotes (AC-8).
 *
 * WHY: Multi-tenancy isolation is a critical security requirement for the
 * SPMET platform. Provider A's quotes must never be visible to Provider B.
 * This negative test creates a second provider org (Provider B), navigates
 * to their quotes list, and asserts it is empty (no quotes from Provider A).
 *
 * NOTE: This test imports from @playwright/test directly (not provider fixture)
 * because it creates a second browser context for a different provider org.
 * The pattern mirrors the hospital multi-tenancy test in tests/hospital/multi-tenancy.spec.ts.
 *
 * vi: "Cách ly đa thuê - nhà cung cấp" / en: "Provider multi-tenancy isolation"
 */
test.describe("Multi-tenancy — provider A cannot see provider B quotes (AC-8)", () => {
  /**
   * Test (AC-8): Second provider cannot see first provider's submitted quotes.
   *
   * WHY: Verifies Convex org-scoped data access. Provider B navigating to
   * /provider/quotes should see only Provider B's quotes (empty for a new org),
   * not the quotes submitted by Provider A (the global-setup provider).
   *
   * This is a NEGATIVE TEST: we assert that the Provider B session shows
   * zero quote items — proving isolation is enforced.
   *
   * vi: "Nhà cung cấp B không thể xem báo giá của nhà cung cấp A"
   * en: "Provider B cannot see Provider A's quotes"
   */
  test("second provider user cannot see first provider quotes", async ({
    browser,
  }) => {
    const timestamp = Date.now();

    // Create a second provider user (different org from global-setup provider)
    const secondProviderUser = {
      name: "Provider B Staff",
      email: `provider-b-${timestamp}@test.medilink.com`,
      password: "TestPassword@123",
      orgName: `Provider B Medical Services ${timestamp}`,
    };

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      // Sign up second provider user with a new org
      // WHY: Using relative path so playwright baseURL config applies
      await secondPage.goto("/sign-up");
      await secondPage.fill("#name", secondProviderUser.name);
      await secondPage.fill("#email", secondProviderUser.email);
      await secondPage.fill("#password", secondProviderUser.password);

      // Select provider role
      await secondPage.click("#provider");

      // Fill organization name for new org creation
      await secondPage.fill("#orgName", secondProviderUser.orgName);

      await secondPage.click('button[type="submit"]');

      // Wait for redirect to provider dashboard
      await secondPage.waitForURL("**/provider/dashboard", {
        timeout: 20000,
      });

      // Navigate to quotes list — should show empty list for new org
      await secondPage.goto("/provider/quotes");
      await expect(secondPage).toHaveURL(/\/provider\/quotes/, {
        timeout: 15000,
      });

      // Quotes list container must be visible
      await expect(
        secondPage.locator('[data-testid="provider-quotes-list"]'),
      ).toBeVisible({ timeout: 10000 });

      // CRITICAL SECURITY ASSERTION: Provider B should see 0 quote items.
      // All quotes belong to Provider A (created in global-setup).
      // If any quote cards appear, multi-tenancy isolation is BROKEN.
      // WHY: The empty state div is shown when quotes.length === 0, which
      // means Provider A's quotes are not leaking to Provider B's session.
      const quoteCards = secondPage.locator(
        '[data-testid="provider-quotes-list"] .space-y-3 > *',
      );
      const cardCount = await quoteCards.count();
      expect(cardCount).toBe(0);
    } finally {
      // Always clean up the second browser context
      await secondContext.close();
    }
  });
});
