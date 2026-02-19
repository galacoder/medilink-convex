import { expect, test } from "../fixtures/provider";
import { ProviderServiceRequestsPage } from "../pages/provider/service-requests.page";

/**
 * Provider service execution and completion report E2E tests (M3-5 AC-5, AC-6).
 *
 * WHY: After a hospital accepts a quote, the provider must execute the service
 * and submit a completion report. This is the operational core of the M3 workflow.
 * Without service execution, equipment doesn't get repaired and the workflow stalls.
 *
 * Covers:
 * - AC-5: Service execution — provider starts service, updates progress, completes
 * - AC-6: Completion report — provider submits completion report with details
 *
 * IMPORTANT NOTE: Tests for service execution (AC-5) and completion report (AC-6)
 * depend on M3-3 (#68 — Service Execution feature). As of M3-5 implementation,
 * issue #68 is being developed in parallel and may not be merged to main yet.
 *
 * Tests marked with test.skip are PENDING M3-3 (#68) merge:
 * - The /provider/service-requests/[id] page currently shows request details
 *   and quote form but does NOT yet have start-service / completion-report UI.
 * - Once #68 merges, remove the skip annotation and update selectors to match
 *   the actual data-testid values from the M3-3 implementation.
 *
 * Selectors to update when #68 lands:
 * - data-testid="start-service-button" (provider starts service)
 * - data-testid="completion-report-form" (completion report form)
 * - data-testid="completion-report-notes" (notes field)
 * - data-testid="submit-completion-button" (submit button)
 *
 * vi: "Kiểm tra thực hiện dịch vụ" / en: "Service execution tests"
 */

/**
 * Test suite: Service execution — verified routing (available now).
 *
 * WHY: Even before #68 lands, we can verify the service request detail page
 * renders correctly for the provider session. The container and heading tests
 * confirm the page infrastructure for service execution is in place.
 */
test.describe("Service execution — page infrastructure (AC-5)", () => {
  /**
   * Test (AC-5 pre-condition): Provider can navigate to service request detail.
   *
   * WHY: Service execution starts from the request detail page. This test
   * confirms the provider auth session grants access to
   * /provider/service-requests/[id] and the detail container renders.
   */
  test("provider can access service request detail page", async ({
    providerPage,
  }) => {
    const srPage = new ProviderServiceRequestsPage(providerPage);
    await srPage.goto();

    await expect(providerPage).toHaveURL(/\/provider\/service-requests/, {
      timeout: 15000,
    });
    await expect(srPage.list).toBeVisible({ timeout: 10000 });

    // If requests exist, verify detail page is accessible
    const rowCount = await srPage.rows.count();
    if (rowCount > 0) {
      await srPage.rows.first().click();
      await expect(providerPage).toHaveURL(
        /\/provider\/service-requests\/[^/]+$/,
        { timeout: 15000 },
      );

      // Detail container must render (data-testid="provider-request-detail")
      await expect(
        providerPage.locator('[data-testid="provider-request-detail"]'),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

/**
 * Test suite: Start service and update progress (AC-5 — PENDING M3-3 #68).
 *
 * WHY: Provider must be able to mark a service as started (status: in_progress)
 * and update progress before marking it complete. This requires the service
 * execution UI from M3-3 (#68) which adds start-service and progress-update
 * buttons to the provider detail page.
 *
 * TODO: Remove test.skip annotations when M3-3 (#68) is merged to main.
 * Update selectors to match actual data-testid values from M3-3 implementation.
 */
test.describe("Start service and update progress (AC-5) — PENDING M3-3 #68", () => {
  /**
   * Test (AC-5): Provider can start a service (in_progress transition).
   *
   * SKIP REASON: Requires M3-3 (#68) service execution feature.
   * The "Start Service" button (data-testid="start-service-button") and
   * status transition to "in_progress" are implemented in M3-3.
   *
   * WHY THIS TEST: When a hospital accepts a quote, the service request
   * transitions to "accepted" status. The provider then clicks "Start Service"
   * to begin work (status -> "in_progress"). Real-time via Convex mutation.
   *
   * TODO when #68 merges:
   * 1. Remove test.skip
   * 2. Navigate to an "accepted"-status request
   * 3. Click data-testid="start-service-button"
   * 4. Assert status changes to "Đang thực hiện" (in_progress)
   */
  test.skip("provider can start service on accepted request", async ({
    providerPage,
  }) => {
    // Navigate to service requests list
    await providerPage.goto("/provider/service-requests");

    // Find an accepted request (status = accepted, quote was approved)
    // WHY: Only accepted requests can be started — enforced by Convex mutation
    const acceptedRow = providerPage.locator(
      '[data-testid="provider-request-row"][data-status="accepted"]',
    );
    const count = await acceptedRow.count();
    if (count > 0) {
      await acceptedRow.first().click();

      // Click start service button (added by M3-3)
      await providerPage
        .locator('[data-testid="start-service-button"]')
        .click();

      // Status badge should update to "Đang thực hiện" (in_progress)
      await expect(
        providerPage.locator('[data-testid="status-badge"]'),
      ).toContainText("Đang thực hiện", { timeout: 10000 });
    }
  });

  /**
   * Test (AC-5): Provider can update service progress.
   *
   * SKIP REASON: Requires M3-3 (#68) service execution feature.
   * Progress update UI is part of the in_progress state management in M3-3.
   *
   * WHY THIS TEST: During service execution, providers may need to submit
   * interim progress notes (e.g., "Parts ordered, awaiting delivery").
   * This keeps the hospital informed of the service status.
   *
   * TODO when #68 merges:
   * 1. Remove test.skip
   * 2. Navigate to an in_progress request
   * 3. Submit a progress update via data-testid="progress-update-form"
   * 4. Assert the update appears in the progress log
   */
  test.skip("provider can update service progress", async ({
    providerPage,
  }) => {
    await providerPage.goto("/provider/service-requests");

    const inProgressRow = providerPage.locator(
      '[data-testid="provider-request-row"][data-status="in_progress"]',
    );
    const count = await inProgressRow.count();
    if (count > 0) {
      await inProgressRow.first().click();

      // Submit progress update (M3-3 feature)
      const progressForm = providerPage.locator(
        '[data-testid="progress-update-form"]',
      );
      await expect(progressForm).toBeVisible({ timeout: 10000 });
    }
  });
});

/**
 * Test suite: Completion report (AC-6 — PENDING M3-3 #68).
 *
 * WHY: After completing a service, the provider must submit a completion report
 * with work details, parts used, and any relevant notes. This triggers the
 * hospital's ability to rate the service. The completion report form is part
 * of the M3-3 (#68) service execution implementation.
 *
 * TODO: Remove test.skip annotations when M3-3 (#68) is merged to main.
 */
test.describe("Completion report (AC-6) — PENDING M3-3 #68", () => {
  /**
   * Test (AC-6): Provider can submit completion report.
   *
   * SKIP REASON: Requires M3-3 (#68) service execution feature.
   * The completion report form (data-testid="completion-report-form") is
   * added to the provider service request detail page in M3-3.
   *
   * WHY THIS TEST: A completion report is required before the hospital can
   * rate the service. The report documents what was done, validating the
   * service was properly executed per Vietnamese medical device regulations.
   *
   * TODO when #68 merges:
   * 1. Remove test.skip
   * 2. Navigate to an in_progress request
   * 3. Fill and submit data-testid="completion-report-form"
   * 4. Assert status transitions to "completed"
   * 5. Assert hospital can now see the rating prompt
   */
  test.skip("provider can submit completion report with details", async ({
    providerPage,
  }) => {
    await providerPage.goto("/provider/service-requests");

    const inProgressRow = providerPage.locator(
      '[data-testid="provider-request-row"][data-status="in_progress"]',
    );
    const count = await inProgressRow.count();
    if (count > 0) {
      await inProgressRow.first().click();

      // Completion report form (added by M3-3)
      const completionForm = providerPage.locator(
        '[data-testid="completion-report-form"]',
      );
      await expect(completionForm).toBeVisible({ timeout: 10000 });

      // Fill completion report fields
      await providerPage
        .locator('[data-testid="completion-report-notes"]')
        .fill("Đã hoàn thành sửa chữa thiết bị. (Repair completed.)");

      // Submit the completion report
      await providerPage
        .locator('[data-testid="submit-completion-button"]')
        .click();

      // Status should transition to "completed"
      await expect(
        providerPage.locator('[data-testid="status-badge"]'),
      ).toContainText("Hoàn thành", { timeout: 15000 });
    }
  });
});
