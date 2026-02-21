/**
 * TypeScript interfaces for the admin-automation feature module.
 *
 * WHY: These types mirror the Convex automationLog query return shapes but
 * are frontend-specific. Using explicit interfaces decouples the UI from
 * the Convex schema so UI changes don't break if Convex return shapes evolve.
 *
 * vi: "Kiểu dữ liệu tự động hóa nền tảng quản trị" / en: "Platform admin automation types"
 */

// ---------------------------------------------------------------------------
// Automation rule names
// vi: "Tên quy tắc tự động hóa" / en: "Automation rule names"
// ---------------------------------------------------------------------------

/** vi: "Tên quy tắc tự động hóa" / en: "Automation rule name" */
export type AutomationRuleName =
  | "checkOverdueRequests"
  | "checkMaintenanceDue"
  | "checkStockLevels"
  | "checkCertificationExpiry"
  | "autoAssignProviders";

/** vi: "Trạng thái thực thi tự động" / en: "Automation execution status" */
export type AutomationStatus = "success" | "error";

// ---------------------------------------------------------------------------
// Automation log entry
// vi: "Mục nhật ký tự động hóa" / en: "Automation log entry"
// ---------------------------------------------------------------------------

/**
 * A single automation rule execution log entry.
 * vi: "Mục nhật ký thực thi quy tắc tự động" / en: "Automation run log entry"
 */
export interface AutomationLogEntry {
  /** vi: "ID bản ghi" / en: "Record ID" */
  _id: string;
  /** vi: "Tên quy tắc" / en: "Rule name" */
  ruleName: AutomationRuleName;
  /** vi: "Trạng thái" / en: "Execution status" */
  status: AutomationStatus;
  /** vi: "Số bản ghi bị ảnh hưởng" / en: "Number of affected records" */
  affectedCount: number;
  /** vi: "Thời gian thực thi (epoch ms)" / en: "Execution timestamp (epoch ms)" */
  runAt: number;
  /** vi: "Thông báo lỗi (nếu có)" / en: "Error message (if any)" */
  errorMessage?: string;
  /** vi: "Metadata bổ sung" / en: "Additional metadata" */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Rule status summary
// vi: "Tóm tắt trạng thái quy tắc" / en: "Rule status summary"
// ---------------------------------------------------------------------------

/**
 * Summary of the last run for each automation rule.
 * Used by the rule status cards on the automation dashboard.
 *
 * vi: "Tóm tắt trạng thái lần chạy gần nhất" / en: "Last run status summary per rule"
 */
export interface AutomationRuleStatus {
  /** vi: "Tên quy tắc" / en: "Rule name" */
  ruleName: AutomationRuleName;
  /** vi: "Lần chạy gần nhất" / en: "Last run entry" */
  lastRun: AutomationLogEntry | null;
}
