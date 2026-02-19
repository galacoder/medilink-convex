import { z } from "zod/v4";

/**
 * Platform admin analytics date range preset enum.
 * Used for filtering platform-wide metrics by time period.
 *
 * vi: "Khoảng thời gian phân tích quản trị" / en: "Admin analytics date range"
 *   7d      - vi: "7 ngày qua"          / en: "Last 7 days"
 *   30d     - vi: "30 ngày qua"         / en: "Last 30 days"
 *   90d     - vi: "90 ngày qua"         / en: "Last 90 days"
 *   ytd     - vi: "Từ đầu năm"          / en: "Year-to-date"
 *   custom  - vi: "Tùy chỉnh"           / en: "Custom range"
 */
export const adminDateRangeSchema = z.enum([
  "7d",
  "30d",
  "90d",
  "ytd",
  "custom",
]);

/**
 * Schema for platform admin analytics filter inputs.
 * vi: "Tham số lọc phân tích quản trị" / en: "Admin analytics filter parameters"
 */
export const adminAnalyticsFilterSchema = z.object({
  // Which time period to aggregate data for
  dateRange: adminDateRangeSchema,
  // Required only when dateRange === "custom"
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  // How many months of history to show in growth charts
  months: z.number().min(1).max(24).optional(),
  // Max items in top-N lists (hospitals, providers)
  limit: z.number().min(1).max(50).optional(),
});

// ---------------------------------------------------------------------------
// Constant arrays with bilingual labels (for date range select rendering)
// ---------------------------------------------------------------------------

/**
 * ADMIN_DATE_RANGES — array for date range select/tab rendering.
 * vi: "Tùy chọn khoảng thời gian quản trị" / en: "Admin date range options"
 */
export const ADMIN_DATE_RANGES: readonly {
  value: "7d" | "30d" | "90d" | "ytd" | "custom";
  labelVi: string;
  labelEn: string;
  days?: number;
}[] = [
  { value: "7d", labelVi: "7 ngày qua", labelEn: "Last 7 days", days: 7 },
  {
    value: "30d",
    labelVi: "30 ngày qua",
    labelEn: "Last 30 days",
    days: 30,
  },
  {
    value: "90d",
    labelVi: "90 ngày qua",
    labelEn: "Last 90 days",
    days: 90,
  },
  {
    value: "ytd",
    labelVi: "Từ đầu năm",
    labelEn: "Year-to-date",
  },
  { value: "custom", labelVi: "Tùy chỉnh", labelEn: "Custom range" },
] as const;

// TypeScript type inference exports
export type AdminDateRange = z.infer<typeof adminDateRangeSchema>;
export type AdminAnalyticsFilter = z.infer<typeof adminAnalyticsFilterSchema>;
