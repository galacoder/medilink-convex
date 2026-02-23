"use client";

import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { DownloadIcon, RefreshCwIcon, ShieldIcon } from "lucide-react";

import { api } from "@medilink/db/api";
import { Button } from "@medilink/ui/button";

import type {
  AuditLogEntryWithDetails,
  AuditLogFilters,
  AuditLogPage,
} from "~/features/admin-audit-log/types";
import { AuditLogFilterPanel } from "~/features/admin-audit-log/components/audit-log-filter-panel";
import { AuditLogTable } from "~/features/admin-audit-log/components/audit-log-table";
import { auditLogLabels } from "~/features/admin-audit-log/labels";

/**
 * Platform admin audit log viewer page.
 *
 * Cross-tenant audit trail for SangLeTech platform administrators.
 * Supports filtering, pagination, full-text search, and CSV export.
 *
 * Access: platform_admin only (enforced in Convex query).
 *
 * WHY: Platform admins need a centralized view of ALL changes across all
 * organizations to investigate security incidents and verify compliance
 * with Vietnamese medical device regulations (Decree 36/2016, 5-year retention).
 *
 * vi: "Trang xem nhật ký kiểm tra cho quản trị viên nền tảng"
 * en: "Platform admin audit log viewer page"
 */
export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allEntries, setAllEntries] = useState<AuditLogEntryWithDetails[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query args from filter state
  const queryArgs = {
    resourceType: filters.resourceType,
    organizationId: filters.organizationId,
    actorId: filters.actorId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search,
    cursor,
    limit: 50,
  };

  // WHY: Cast result to AuditLogPage because api.d.ts uses AnyApi, which
  // causes useQuery to infer `any`. Explicit cast restores type safety.
  const result = useQuery(api.admin.auditLog.list, queryArgs) as
    | AuditLogPage
    | undefined;

  const isLoading = result === undefined;

  // When filters change, reset pagination and use fresh results
  const handleFiltersChange = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCursor(undefined);
    setAllEntries([]);
  }, []);

  // Merge new page results into accumulated entries
  const currentEntries: AuditLogEntryWithDetails[] =
    cursor === undefined
      ? (result?.entries ?? [])
      : [...allEntries, ...(result?.entries ?? [])];

  function handleLoadMore() {
    if (!result?.cursor) return;
    setIsLoadingMore(true);
    setAllEntries(currentEntries);
    setCursor(result.cursor);
    setIsLoadingMore(false);
  }

  function handleRefresh() {
    setCursor(undefined);
    setAllEntries([]);
  }

  // CSV export: trigger a fresh query with no pagination, then download
  function handleExportCSV() {
    // WHY: We open the export as a URL parameter so the browser handles
    // the file download without a server round-trip. The Convex exportCSV
    // query returns a CSV string that we convert to a Blob.
    const csvContent = buildCSVFromEntries(currentEntries);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-semibold">
              {auditLogLabels.title.vi} {/* Nhật ký kiểm tra / Audit Log */}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {auditLogLabels.subtitle.vi}{" "}
            {/* Theo dõi tất cả các thay đổi trên nền tảng */}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            {auditLogLabels.actions.refresh.vi}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={currentEntries.length === 0}
            className="gap-1.5"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {auditLogLabels.actions.export.vi}
          </Button>
        </div>
      </div>

      {/* Retention info bar */}
      {result && (
        <div className="bg-muted/40 flex flex-wrap items-center gap-4 rounded-lg border px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">
            {auditLogLabels.retention.totalEntries.vi}:{" "}
            <strong>{result.totalCount.toLocaleString("vi-VN")}</strong>
          </span>
          {result.oldestEntryAt && (
            <span className="text-muted-foreground">
              {auditLogLabels.retention.oldestEntry.vi}:{" "}
              <strong>
                {new Date(result.oldestEntryAt).toLocaleDateString("vi-VN")}
              </strong>
            </span>
          )}
          <span className="text-purple-600">
            {auditLogLabels.retention.retentionPolicy.vi}
          </span>
        </div>
      )}

      {/* Filter panel */}
      <AuditLogFilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Audit log table */}
      <AuditLogTable
        entries={currentEntries}
        isLoading={isLoading}
        canLoadMore={result?.isDone === false && currentEntries.length > 0}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV builder (client-side, from loaded entries)
// ---------------------------------------------------------------------------

/**
 * Builds a CSV string from the currently loaded audit log entries.
 *
 * WHY: Platform admins need to export filtered results to CSV for compliance
 * reporting. We build from loaded entries client-side to avoid a second Convex
 * query and to respect the currently applied filters.
 *
 * vi: "Tạo nội dung CSV từ dữ liệu đã tải" / en: "Build CSV from loaded entries"
 */
function buildCSVFromEntries(entries: AuditLogEntryWithDetails[]): string {
  const headers = [
    "Thời gian / Timestamp",
    "Người thực hiện / Actor",
    "Email / Actor Email",
    "Hành động / Action",
    "Loại tài nguyên / Resource Type",
    "ID tài nguyên / Resource ID",
    "Tổ chức / Organization",
  ];

  const escapeCsv = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = entries.map((entry) =>
    [
      escapeCsv(new Date(entry.createdAt).toISOString()),
      escapeCsv(entry.actorName ?? entry.actorId),
      escapeCsv(entry.actorEmail ?? ""),
      escapeCsv(entry.action),
      escapeCsv(entry.resourceType),
      escapeCsv(entry.resourceId),
      escapeCsv(entry.organizationName ?? entry.organizationId),
    ].join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
