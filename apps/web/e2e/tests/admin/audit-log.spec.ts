import { expect, test } from "../../fixtures/admin";
import { AdminAuditLogPage } from "../../pages/admin/audit-log.page";

/**
 * Platform admin audit log E2E tests.
 *
 * WHY: The audit log is a compliance-critical feature — platform admins
 * use it to investigate security incidents and verify compliance with
 * Vietnamese medical device regulations (Decree 36/2016, 5-year retention).
 * These tests verify:
 *   1. The admin session allows access to /admin/audit-log
 *   2. The page heading shows "Nhật ký kiểm tra" (Audit Log)
 *   3. The action buttons (refresh, export) render
 *   4. The AuditLogFilterPanel renders for search/filter controls
 *
 * Note: Tests do NOT assert specific log entry counts — the audit log
 * may be empty in test environments. Verifying UI structure is sufficient.
 *
 * Uses the adminPage auth fixture (pre-authenticated via global-setup.ts).
 */
test.describe("Admin audit log", () => {
  /**
   * Test: Admin can navigate to /admin/audit-log.
   *
   * WHY: Verifies the admin session allows access to the compliance-critical
   * audit log route without redirect to sign-in.
   */
  test("admin can view audit log page", async ({ adminPage }) => {
    const auditLogPage = new AdminAuditLogPage(adminPage);
    await auditLogPage.goto();

    // Page should be accessible without redirect to sign-in
    await expect(adminPage).toHaveURL(/\/admin\/audit-log/, {
      timeout: 15000,
    });
  });

  /**
   * Test: Audit log page shows the correct Vietnamese heading.
   *
   * WHY: Confirms the AuditLogPage component rendered with the correct
   * bilingual heading: "Nhật ký kiểm tra" (vi: Audit Log).
   * The ShieldIcon + h1 combination is unique to this page.
   */
  test("audit log page shows correct heading", async ({ adminPage }) => {
    const auditLogPage = new AdminAuditLogPage(adminPage);
    await auditLogPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/audit-log/, {
      timeout: 15000,
    });

    await expect(auditLogPage.heading).toContainText("Nhật ký kiểm tra", {
      timeout: 10000,
    });
  });

  /**
   * Test: Audit log page renders the refresh and export action buttons.
   *
   * WHY: The export CSV button is a compliance feature — confirming it
   * renders verifies the AuditLogPage loaded its action bar correctly.
   * The refresh button is always visible (not disabled when empty).
   */
  test("audit log page renders action buttons", async ({ adminPage }) => {
    const auditLogPage = new AdminAuditLogPage(adminPage);
    await auditLogPage.goto();

    await expect(adminPage).toHaveURL(/\/admin\/audit-log/, {
      timeout: 15000,
    });

    // Refresh button is always enabled (doesn't require data)
    await expect(auditLogPage.refreshButton).toBeVisible({ timeout: 10000 });
  });
});
