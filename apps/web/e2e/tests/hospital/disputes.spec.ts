import { expect, test } from "../../fixtures/auth";

/**
 * Hospital dispute workflow E2E tests (M2-6 AC-7).
 *
 * WHY: Dispute creation, messaging, and status tracking are critical
 * for hospital staff to escalate unresolved service issues. When a
 * service is completed unsatisfactorily, staff must be able to raise
 * a formal dispute and communicate with the provider through the platform.
 *
 * STATUS: Tests are skipped pending M2-5 disputes UI implementation.
 * The dispute data model exists in Convex schema (disputes + disputeMessages tables),
 * but the hospital portal UI (/hospital/disputes/page.tsx) has not been built yet.
 *
 * TODO: Remove test.skip() when M2-5 disputes UI is merged to main.
 * Reference: Issue #64 (M2-5 Dispute Resolution — Hospital Portal)
 *
 * vi: "Kiểm tra E2E quy trình khiếu nại bệnh viện" / en: "Hospital dispute workflow E2E tests"
 */
test.describe("Dispute workflow", () => {
  /**
   * Test: Hospital user can raise a dispute on a completed service.
   *
   * WHY: Dispute creation is the first step in the escalation workflow.
   * Hospital staff must be able to raise a dispute directly from a
   * completed service request detail page.
   *
   * TODO: Pending M2-5 — /hospital/disputes/page.tsx does not exist.
   * vi: "Tạo khiếu nại" / en: "Raise dispute"
   */
  test.skip(
    "hospital user can raise dispute on completed service",
    async ({ hospitalPage }) => {
      // Navigate to disputes page (not yet implemented)
      await hospitalPage.goto("/hospital/disputes");
      await expect(hospitalPage).toHaveURL(/\/hospital\/disputes/, {
        timeout: 15000,
      });

      // TODO: Fill dispute form with subject, description, related service request
      // TODO: Submit dispute via form
      // TODO: Verify dispute created with "open" status badge
    },
  );

  /**
   * Test: Hospital user can add message to existing dispute.
   *
   * WHY: Dispute messaging enables back-and-forth communication between
   * hospital staff and service providers within the platform.
   *
   * TODO: Pending M2-5 — dispute messaging UI not yet implemented.
   * vi: "Thêm tin nhắn khiếu nại" / en: "Add dispute message"
   */
  test.skip(
    "hospital user can add message to existing dispute",
    async () => {
      // TODO: Navigate to dispute detail page
      // TODO: Locate the message input field
      // TODO: Add dispute message text
      // TODO: Submit message via send button
      // TODO: Verify message appears in dispute thread
    },
  );

  /**
   * Test: Dispute status updates when resolved.
   *
   * WHY: Resolution tracking is critical for compliance reporting —
   * the system must record when disputes are closed and how they were resolved.
   *
   * TODO: Pending M2-5 — dispute resolution workflow not yet implemented.
   * vi: "Cập nhật trạng thái khiếu nại" / en: "Dispute status update"
   */
  test.skip(
    "dispute status updates when marked resolved",
    async () => {
      // TODO: Navigate to open dispute
      // TODO: Locate "mark as resolved" action button
      // TODO: Click resolve button
      // TODO: Verify status badge changes to "resolved"
      // TODO: Verify resolved dispute no longer appears in open disputes list
    },
  );
});
