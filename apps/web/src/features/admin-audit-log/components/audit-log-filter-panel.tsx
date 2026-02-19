"use client";

import { useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import type { AuditLogFilters } from "../types";
import { auditLogLabels } from "../labels";

interface AuditLogFilterPanelProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}

/**
 * Filter panel for the audit log viewer.
 *
 * Provides dropdowns for action type and resource type,
 * plus a text search input for full-text search on action details.
 *
 * WHY: Platform admins need fine-grained filtering to quickly locate specific
 * audit events during incident investigations. All filters update the parent
 * state via onFiltersChange (controlled component pattern).
 *
 * vi: "Bảng bộ lọc nhật ký kiểm tra" / en: "Audit log filter panel"
 */
export function AuditLogFilterPanel({
  filters,
  onFiltersChange,
}: AuditLogFilterPanelProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  const hasActiveFilters =
    filters.actionType ??
    filters.resourceType ??
    filters.search ??
    filters.dateFrom ??
    filters.dateTo;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue || undefined });
  }

  function handleClearAll() {
    setSearchValue("");
    onFiltersChange({});
  }

  return (
    <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {auditLogLabels.filters.title.vi}{" "}
          <span className="text-muted-foreground font-normal">
            ({auditLogLabels.filters.title.en})
          </span>
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 gap-1 text-xs"
          >
            <XIcon className="h-3 w-3" />
            {auditLogLabels.filters.clearAll.vi}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Action type filter */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            {auditLogLabels.filters.actionType.vi}
          </Label>
          <Select
            value={filters.actionType ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                actionType:
                  value === "all"
                    ? undefined
                    : (value as AuditLogFilters["actionType"]),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {auditLogLabels.filters.allActionTypes.vi}
              </SelectItem>
              <SelectItem value="create">
                {auditLogLabels.actionTypes.create.vi}
              </SelectItem>
              <SelectItem value="update">
                {auditLogLabels.actionTypes.update.vi}
              </SelectItem>
              <SelectItem value="delete">
                {auditLogLabels.actionTypes.delete.vi}
              </SelectItem>
              <SelectItem value="status_change">
                {auditLogLabels.actionTypes.status_change.vi}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resource type filter */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            {auditLogLabels.filters.resourceType.vi}
          </Label>
          <Select
            value={filters.resourceType ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                resourceType:
                  value === "all"
                    ? undefined
                    : (value as AuditLogFilters["resourceType"]),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {auditLogLabels.filters.allResourceTypes.vi}
              </SelectItem>
              <SelectItem value="equipment">
                {auditLogLabels.resourceTypes.equipment.vi}
              </SelectItem>
              <SelectItem value="service_request">
                {auditLogLabels.resourceTypes.service_request.vi}
              </SelectItem>
              <SelectItem value="quote">
                {auditLogLabels.resourceTypes.quote.vi}
              </SelectItem>
              <SelectItem value="dispute">
                {auditLogLabels.resourceTypes.dispute.vi}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date from */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            {auditLogLabels.filters.dateFrom.vi}
          </Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={
              filters.dateFrom
                ? new Date(filters.dateFrom).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value
                  ? new Date(e.target.value).getTime()
                  : undefined,
              })
            }
          />
        </div>

        {/* Date to */}
        <div className="space-y-1.5">
          <Label className="text-xs">{auditLogLabels.filters.dateTo.vi}</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={
              filters.dateTo
                ? new Date(filters.dateTo).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value
                  ? new Date(e.target.value).getTime() + 86399999 // end of day
                  : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Full-text search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-2 left-2.5 h-3.5 w-3.5" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder={auditLogLabels.filters.searchPlaceholder.vi}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="h-8 text-xs">
          {auditLogLabels.filters.search.en}
        </Button>
      </form>
    </div>
  );
}
