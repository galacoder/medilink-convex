"use client";

/**
 * Automation dashboard page for platform admin.
 *
 * Shows:
 * 1. Rule status cards — current health of each automation rule
 *    (last run time, status, affected count)
 * 2. Run history table — recent automation executions with details
 *
 * WHY: Platform admins need visibility into automation health without
 * checking the Convex dashboard directly. This page surfaces automation
 * status in the familiar MediLink admin UI.
 *
 * Access: Platform admin only (route group /admin enforces this).
 *
 * vi: "Trang quản lý tự động hóa nền tảng" / en: "Platform admin automation dashboard"
 */
import { BotIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import {
  automationLabels,
  AutomationLogTable,
  AutomationRuleCards,
  useAutomationLog,
  useAutomationRuleStatus,
} from "~/features/admin-automation";

/**
 * Automation dashboard page.
 *
 * Uses "use client" because it subscribes to Convex queries (useQuery).
 * All data is fetched client-side via real-time Convex subscriptions so
 * the dashboard updates automatically when crons run.
 */
export default function AdminAutomationPage() {
  // Fetch rule status summary (one entry per rule, showing last run)
  const ruleStatuses = useAutomationRuleStatus();
  const isRuleStatusLoading = ruleStatuses === undefined;

  // Fetch full run history (most recent first, limit 100)
  const logs = useAutomationLog();
  const isLogsLoading = logs === undefined;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <BotIcon className="h-6 w-6" />
          {automationLabels.page.title.vi}
          {/* Automation */}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {automationLabels.page.description.vi}
          {/* Manage and monitor platform automation rules */}
        </p>
      </div>

      {/* Rule status cards */}
      <section>
        <h2 className="mb-3 text-lg font-medium">
          {automationLabels.cards.title.vi}
          {/* Rule Status */}
        </h2>
        <AutomationRuleCards
          ruleStatuses={ruleStatuses ?? []}
          isLoading={isRuleStatusLoading}
        />
      </section>

      {/* Run history table */}
      <Card>
        <CardHeader>
          <CardTitle>{automationLabels.table.title.vi}</CardTitle>
          {/* Run History */}
          <CardDescription>
            {automationLabels.page.description.vi}
            {/* Manage and monitor platform automation rules */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutomationLogTable logs={logs ?? []} isLoading={isLogsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
