"use client";

/**
 * Automation run history table for the admin automation dashboard.
 *
 * Displays a chronological list of automation rule executions with:
 * - Rule name (bilingual)
 * - Execution status (success/error)
 * - Number of affected records
 * - Execution timestamp
 * - Error message (if any)
 *
 * vi: "Bảng lịch sử thực thi tự động hóa" / en: "Automation run history table"
 */
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { AutomationLogEntry } from "../types";
import { automationLabels } from "../labels";

interface AutomationLogTableProps {
  /** vi: "Danh sách lịch sử thực thi" / en: "Run history entries" */
  logs: AutomationLogEntry[];
  /** vi: "Đang tải dữ liệu" / en: "Loading state" */
  isLoading?: boolean;
}

/**
 * Format a Unix epoch ms timestamp to a localized date-time string.
 * Uses Vietnamese locale for display per CLAUDE.md.
 *
 * vi: "Định dạng thời gian hiển thị" / en: "Format display timestamp"
 */
function formatRunAt(epochMs: number): string {
  return new Date(epochMs).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Automation run history table.
 * Shows skeleton rows while loading and empty state when no logs exist.
 */
export function AutomationLogTable({
  logs,
  isLoading = false,
}: AutomationLogTableProps) {
  const labels = automationLabels.table;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        {labels.noData.vi}
        {/* No run history yet */}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.ruleName.vi}</TableHead>
          <TableHead>{labels.status.vi}</TableHead>
          <TableHead className="text-right">
            {labels.affectedCount.vi}
          </TableHead>
          <TableHead>{labels.runAt.vi}</TableHead>
          <TableHead>{labels.errorMessage.vi}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log._id}>
            {/* Rule name */}
            <TableCell className="font-medium">
              <span className="block">
                {automationLabels.ruleNames[log.ruleName].vi}
              </span>
              <span className="text-muted-foreground text-xs">
                {automationLabels.ruleNames[log.ruleName].en}
              </span>
            </TableCell>

            {/* Status icon */}
            <TableCell>
              {log.status === "success" ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2Icon className="h-4 w-4" />
                  <span className="text-sm">
                    {automationLabels.status.success.vi}
                  </span>
                  {/* Success */}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircleIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {automationLabels.status.error.vi}
                  </span>
                  {/* Error */}
                </span>
              )}
            </TableCell>

            {/* Affected count */}
            <TableCell className="text-right font-mono text-sm">
              {log.affectedCount}
            </TableCell>

            {/* Run timestamp */}
            <TableCell className="text-sm">{formatRunAt(log.runAt)}</TableCell>

            {/* Error message */}
            <TableCell className="text-destructive max-w-xs truncate text-xs">
              {log.errorMessage ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
