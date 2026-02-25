"use client";

/**
 * Payment list filter controls: status tabs + search input.
 *
 * vi: "Bo loc danh sach thanh toan" / en: "Payment list filters"
 */
import { Input } from "@medilink/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import type { PaymentFilters, PaymentStatus } from "../types";
import { adminPaymentLabels } from "../labels";

interface PaymentFiltersBarProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  locale?: "vi" | "en";
}

const STATUS_OPTIONS: Array<{
  value: PaymentStatus | "all";
  key: keyof typeof adminPaymentLabels.statuses | "all";
}> = [
  { value: "all", key: "all" },
  { value: "pending", key: "pending" },
  { value: "confirmed", key: "confirmed" },
  { value: "rejected", key: "rejected" },
  { value: "refunded", key: "refunded" },
];

export function PaymentFiltersBar({
  filters,
  onFiltersChange,
  locale = "vi",
}: PaymentFiltersBarProps) {
  const L = adminPaymentLabels;

  return (
    <div className="flex items-center gap-3">
      {/* Search input */}
      <Input
        placeholder={L.filters.searchPlaceholder[locale]}
        value={filters.searchQuery ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            searchQuery: e.target.value || undefined,
          })
        }
        className="w-64"
      />

      {/* Status filter */}
      <Select
        value={filters.statusFilter ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            statusFilter: value as PaymentStatus | "all",
          })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={L.filters.allStatuses[locale]} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.key === "all"
                ? L.filters.allStatuses[locale]
                : L.statuses[opt.key][locale]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
