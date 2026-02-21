"use client";

/**
 * React hooks for the admin-automation feature module.
 *
 * WHY: Hooks encapsulate the Convex useQuery subscriptions, keeping
 * components clean and making data fetching easily testable.
 *
 * vi: "Hook dữ liệu tự động hóa" / en: "Automation data hooks"
 */
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type {
  AutomationLogEntry,
  AutomationRuleName,
  AutomationRuleStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Hook: useAutomationLog
// ---------------------------------------------------------------------------

/**
 * Fetches automation run history from Convex, optionally filtered by rule name.
 * Returns undefined while loading, [] when no data exists.
 *
 * vi: "Hook lấy lịch sử thực thi tự động hóa" / en: "Hook for automation run history"
 */
export function useAutomationLog(
  ruleName?: AutomationRuleName,
  limit = 100,
): AutomationLogEntry[] | undefined {
  const logs = useQuery(api.automation.automationLog.listAutomationLogs, {
    ruleName,
    limit,
  });
  // useQuery returns undefined while loading
  return logs as AutomationLogEntry[] | undefined;
}

// ---------------------------------------------------------------------------
// Hook: useAutomationRuleStatus
// ---------------------------------------------------------------------------

/**
 * Fetches the last run status for each automation rule.
 * Used by the rule status cards on the dashboard.
 *
 * vi: "Hook lấy trạng thái quy tắc tự động hóa" / en: "Hook for automation rule status"
 */
export function useAutomationRuleStatus(): AutomationRuleStatus[] | undefined {
  const statuses = useQuery(
    api.automation.automationLog.getAutomationRuleStatus,
    {},
  );
  return statuses as AutomationRuleStatus[] | undefined;
}
