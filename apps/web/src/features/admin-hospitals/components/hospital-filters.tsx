"use client";

/**
 * Search and filter controls for the hospital list.
 *
 * WHY: Encapsulates the filter UI (search input + status dropdown) so
 * the page component stays clean. Filter changes are propagated via callback.
 *
 * vi: "Bộ lọc danh sách bệnh viện" / en: "Hospital list filters"
 */
import { Input } from "@medilink/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import type { HospitalFilters, HospitalStatus } from "../types";
import { adminHospitalLabels } from "../labels";

interface HospitalFiltersProps {
  filters: HospitalFilters;
  onFiltersChange: (filters: HospitalFilters) => void;
  locale?: "vi" | "en";
}

/**
 * Search input + status filter select for hospital list page.
 *
 * vi: "Thanh lọc danh sách bệnh viện" / en: "Hospital list filter bar"
 */
export function HospitalFiltersBar({
  filters,
  onFiltersChange,
  locale = "vi",
}: HospitalFiltersProps) {
  const L = adminHospitalLabels;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as HospitalStatus),
    });
  };

  return (
    <div className="flex gap-3">
      <Input
        placeholder={L.filters.searchPlaceholder[locale]}
        value={filters.search ?? ""}
        onChange={handleSearchChange}
        className="max-w-xs"
      />
      <Select
        value={filters.status ?? "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={L.filters.allStatuses[locale]} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{L.filters.allStatuses[locale]}</SelectItem>
          <SelectItem value="active">{L.statuses.active[locale]}</SelectItem>
          <SelectItem value="trial">{L.statuses.trial[locale]}</SelectItem>
          <SelectItem value="suspended">
            {L.statuses.suspended[locale]}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
