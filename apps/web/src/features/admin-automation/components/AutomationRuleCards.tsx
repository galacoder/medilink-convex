"use client";

/**
 * Automation rule status cards for the admin automation dashboard.
 *
 * Displays a card for each automation rule showing:
 * - Rule name and description (bilingual)
 * - Schedule information
 * - Last run timestamp and status
 * - Number of affected records on last run
 *
 * vi: "Thẻ trạng thái quy tắc tự động hóa" / en: "Automation rule status cards"
 */
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  PackageIcon,
  ShieldAlertIcon,
  WrenchIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import type { AutomationRuleName, AutomationRuleStatus } from "../types";
import { automationLabels } from "../labels";

interface AutomationRuleCardsProps {
  /** vi: "Danh sách trạng thái quy tắc" / en: "Rule status entries" */
  ruleStatuses: AutomationRuleStatus[];
  /** vi: "Đang tải" / en: "Loading state" */
  isLoading?: boolean;
}

/**
 * Icon mapping for each automation rule.
 * WHY: Visual icons help platform admins quickly identify each rule
 * without reading the full label text.
 */
const RULE_ICONS: Record<AutomationRuleName, React.ReactNode> = {
  checkOverdueRequests: (
    <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
  ),
  checkMaintenanceDue: <WrenchIcon className="h-5 w-5 text-blue-500" />,
  checkStockLevels: <PackageIcon className="h-5 w-5 text-purple-500" />,
  checkCertificationExpiry: (
    <ShieldAlertIcon className="h-5 w-5 text-red-500" />
  ),
  autoAssignProviders: <ActivityIcon className="h-5 w-5 text-green-500" />,
};

/**
 * Format a Unix epoch ms timestamp to a relative or absolute string.
 *
 * vi: "Định dạng thời gian tương đối" / en: "Format relative timestamp"
 */
function formatLastRun(epochMs: number): string {
  const now = Date.now();
  const diffMs = now - epochMs;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Vừa xong / Just now";
  if (diffMins < 60) return `${diffMins} phút trước / ${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} giờ trước / ${diffHours}h ago`;
  return `${diffDays} ngày trước / ${diffDays}d ago`;
}

/**
 * Single rule status card.
 * Shows the last run result and schedule for one automation rule.
 */
function RuleCard({ ruleStatus }: { ruleStatus: AutomationRuleStatus }) {
  const { ruleName, lastRun } = ruleStatus;
  const icon = RULE_ICONS[ruleName];
  const nameLabel = automationLabels.ruleNames[ruleName];
  const description = automationLabels.ruleDescriptions[ruleName];
  const schedule = automationLabels.schedules[ruleName];

  const hasError = lastRun?.status === "error";
  const hasNeverRun = lastRun === null;

  return (
    <Card className={hasError ? "border-red-200" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">
              <span className="block">{nameLabel?.vi}</span>
              <span className="text-muted-foreground block text-xs font-normal">
                {nameLabel?.en}
              </span>
            </CardTitle>
          </div>

          {/* Status badge */}
          {hasNeverRun ? (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {automationLabels.status.never.vi}
            </span>
          ) : hasError ? (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
              {automationLabels.status.error.vi}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              <CheckCircle2Icon className="h-3 w-3" />
              {automationLabels.status.success.vi}
            </span>
          )}
        </div>
        <CardDescription className="mt-1 text-xs">
          {description?.vi}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {/* Schedule */}
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <ClockIcon className="h-3 w-3" />
          <span>
            {schedule?.vi}
            {/* {schedule?.en} */}
          </span>
        </div>

        {/* Last run info */}
        {lastRun !== null ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {automationLabels.cards.lastRun.vi}
              </span>
              <span className="text-xs font-medium">
                {formatLastRun(lastRun.runAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {automationLabels.cards.affectedCount.vi}
              </span>
              <span className="font-mono text-xs font-medium">
                {lastRun.affectedCount}
              </span>
            </div>
            {hasError && lastRun.errorMessage && (
              <p className="text-destructive mt-1 truncate text-xs">
                {lastRun.errorMessage}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            {automationLabels.states.noData.vi}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grid of automation rule status cards.
 * Shows skeleton placeholders while loading.
 */
export function AutomationRuleCards({
  ruleStatuses,
  isLoading = false,
}: AutomationRuleCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ruleStatuses.map((ruleStatus) => (
        <RuleCard key={ruleStatus.ruleName} ruleStatus={ruleStatus} />
      ))}
    </div>
  );
}
