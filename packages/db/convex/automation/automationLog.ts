/**
 * Automation log queries and internal helpers for M5-2.
 *
 * The automationLog table records every cron/automation rule execution.
 * Platform admins use this for the automation dashboard to monitor run
 * history and rule status.
 *
 * WHY: Cron functions run silently — without a log table, there is no way
 * to observe automation health. This log provides observability and
 * audit history for compliance.
 *
 * Multi-tenancy: automationLog is platform-scoped (not org-scoped) because
 * cron jobs iterate over ALL organizations. The dashboard is only accessible
 * to platform_admin role.
 *
 * vi: "Nhật ký tự động hóa" / en: "Automation run log"
 */

import { v } from "convex/values";

import { internalMutation, query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List automation run logs, ordered by most recent first.
 * Optionally filter by ruleName.
 *
 * vi: "Danh sách lịch sử chạy tự động" / en: "List automation run history"
 */
export const listAutomationLogs = query({
  args: {
    // vi: "Lọc theo tên quy tắc" / en: "Filter by rule name"
    ruleName: v.optional(
      v.union(
        v.literal("checkOverdueRequests"),
        v.literal("checkMaintenanceDue"),
        v.literal("checkStockLevels"),
        v.literal("checkCertificationExpiry"),
        v.literal("autoAssignProviders"),
      ),
    ),
    // vi: "Số lượng bản ghi tối đa" / en: "Max results to return"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.ruleName !== undefined) {
      // Filter by rule name using index
      return ctx.db
        .query("automationLog")
        .withIndex("by_rule_name", (q) => q.eq("ruleName", args.ruleName!))
        .order("desc")
        .take(limit);
    }

    // Return all logs ordered by runAt (most recent first via _creationTime)
    return ctx.db
      .query("automationLog")
      .withIndex("by_run_at")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get the last run for each automation rule (rule status summary).
 * Used by the automation dashboard's rule status cards.
 *
 * vi: "Lấy lần chạy gần nhất của từng quy tắc" / en: "Get last run per rule"
 */
export const getAutomationRuleStatus = query({
  args: {},
  handler: async (ctx) => {
    const rules = [
      "checkOverdueRequests",
      "checkMaintenanceDue",
      "checkStockLevels",
      "checkCertificationExpiry",
      "autoAssignProviders",
    ] as const;

    const results = await Promise.all(
      rules.map(async (ruleName) => {
        const lastRun = await ctx.db
          .query("automationLog")
          .withIndex("by_rule_name", (q) => q.eq("ruleName", ruleName))
          .order("desc")
          .first();
        return {
          ruleName,
          lastRun: lastRun ?? null,
        };
      }),
    );

    return results;
  },
});

// ---------------------------------------------------------------------------
// Internal mutations (called by cron rules, not exposed to client)
// ---------------------------------------------------------------------------

/**
 * Record an automation rule execution in the log.
 * Called internally by each cron rule function after completion.
 *
 * vi: "Ghi lại kết quả thực thi quy tắc tự động" / en: "Record automation rule run"
 */
export const recordAutomationRun = internalMutation({
  args: {
    ruleName: v.union(
      v.literal("checkOverdueRequests"),
      v.literal("checkMaintenanceDue"),
      v.literal("checkStockLevels"),
      v.literal("checkCertificationExpiry"),
      v.literal("autoAssignProviders"),
    ),
    status: v.union(v.literal("success"), v.literal("error")),
    affectedCount: v.number(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("automationLog", {
      ruleName: args.ruleName,
      status: args.status,
      affectedCount: args.affectedCount,
      runAt: now,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});
