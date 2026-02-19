"use client";

/**
 * Date range filter tabs component for the analytics dashboard.
 *
 * WHY: Providers need to switch between different time horizons to understand
 * both short-term (7d) and medium-term (30d, 90d) performance trends.
 *
 * vi: "Bộ lọc khoảng thời gian" / en: "Date range filter"
 */
import type { DateRangePreset } from "../types";
import { analyticsLabels } from "../labels";

interface DateRangeFilterProps {
  selected: DateRangePreset;
  onChange: (range: DateRangePreset) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRangePreset; labelVi: string }[] = [
  { value: "7d", labelVi: "7 ngày" },
  { value: "30d", labelVi: "30 ngày" },
  { value: "90d", labelVi: "90 ngày" },
];

/**
 * Renders preset date range buttons (7d / 30d / 90d).
 * Custom range can be added in a future iteration.
 */
export function DateRangeFilter({ selected, onChange }: DateRangeFilterProps) {
  // Suppress unused variable warning — labels kept for future i18n
  void analyticsLabels;

  return (
    <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
      {DATE_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            selected === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={selected === option.value}
          aria-label={option.labelVi}
        >
          {option.labelVi}
        </button>
      ))}
    </div>
  );
}
