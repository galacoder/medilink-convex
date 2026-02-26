/**
 * Filter bar for subscription list view.
 *
 * Includes status filter tabs and search input.
 *
 * vi: "Thanh bo loc danh sach dang ky"
 * en: "Subscription list filter bar"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { Input } from "@medilink/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@medilink/ui/tabs";

import type { StatusFilter } from "../types";
import { billingLabels } from "../labels";

interface SubscriptionFiltersProps {
  statusFilter: StatusFilter;
  searchQuery: string;
  onStatusChange: (status: StatusFilter) => void;
  onSearchChange: (query: string) => void;
  locale?: "vi" | "en";
}

const STATUS_OPTIONS: {
  value: StatusFilter;
  labelKey: keyof typeof billingLabels;
}[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "active", labelKey: "statusActive" },
  { value: "trial", labelKey: "statusTrial" },
  { value: "grace_period", labelKey: "statusGracePeriod" },
  { value: "expired", labelKey: "statusExpired" },
  { value: "suspended", labelKey: "statusSuspended" },
];

/**
 * Renders status filter tabs and search input.
 *
 * vi: "Hien thi tab bo loc trang thai va o tim kiem"
 * en: "Display status filter tabs and search input"
 */
export function SubscriptionFilters({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
  locale = "vi",
}: SubscriptionFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as StatusFilter)}
      >
        <TabsList className="flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              className="text-xs sm:text-sm"
            >
              {billingLabels[opt.labelKey][locale]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Input
        placeholder={billingLabels.searchPlaceholder[locale]}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-xs"
      />
    </div>
  );
}
