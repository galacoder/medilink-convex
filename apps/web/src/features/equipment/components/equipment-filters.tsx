"use client";

import { useCallback, useState } from "react";

import { Input } from "@medilink/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import { equipmentLabels } from "../labels";
import type { EquipmentFilters } from "../types";

type EquipmentStatus = "available" | "in_use" | "maintenance" | "damaged" | "retired";

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  onChange: (filters: EquipmentFilters) => void;
}

const ALL_STATUSES_VALUE = "__all__";

/**
 * Filter bar for the equipment list page.
 *
 * WHY: Hospital staff need to quickly narrow equipment by status (e.g. only
 * see "available" equipment for borrowing). Search enables finding specific
 * devices by name in Vietnamese or English.
 */
export function EquipmentFiltersBar({ filters, onChange }: EquipmentFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleStatusChange = useCallback(
    (value: string) => {
      onChange({
        ...filters,
        status: value === ALL_STATUSES_VALUE ? undefined : (value as EquipmentStatus),
      });
    },
    [filters, onChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      // Debounce search by 300ms
      if (searchTimer) clearTimeout(searchTimer);
      const timer = setTimeout(() => {
        onChange({
          ...filters,
          search: value || undefined,
        });
      }, 300);
      setSearchTimer(timer);
    },
    [filters, onChange, searchTimer],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="flex-1">
        <Input
          type="search"
          placeholder={equipmentLabels.searchPlaceholder.vi}
          value={searchValue}
          onChange={handleSearchChange}
          className="w-full"
          aria-label={equipmentLabels.search.vi}
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-52">
        <Select
          value={filters.status ?? ALL_STATUSES_VALUE}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger aria-label={equipmentLabels.filterByStatus.vi}>
            <SelectValue placeholder={equipmentLabels.allStatuses.vi} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES_VALUE}>
              {equipmentLabels.allStatuses.vi}
            </SelectItem>
            {(["available", "in_use", "maintenance", "damaged", "retired"] as const).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {equipmentLabels.statusValues[status].vi}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
