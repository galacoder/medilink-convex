import { z } from "zod/v4";

/**
 * Analytics date range preset enum.
 * vi: "Khoảng thời gian phân tích" / en: "Analytics date range"
 *   7d     - vi: "7 ngày qua"         / en: "Last 7 days"
 *   30d    - vi: "30 ngày qua"        / en: "Last 30 days"
 *   90d    - vi: "90 ngày qua"        / en: "Last 90 days"
 *   custom - vi: "Tùy chỉnh"          / en: "Custom range"
 */
export const analyticsDateRangeSchema = z.enum(["7d", "30d", "90d", "custom"]);

/**
 * Schema for analytics filter parameters submitted from the dashboard.
 * vi: "Tham số lọc phân tích" / en: "Analytics filter parameters"
 */
export const analyticsFilterSchema = z.object({
  // Required: which provider to aggregate data for
  providerId: z.string().min(1, {
    message: "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  // Required: which date range preset to use
  dateRange: analyticsDateRangeSchema,
  // Required only when dateRange === "custom"
  startDate: z.number().optional(),
  endDate: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Constant arrays with bilingual labels (for date range select rendering)
// ---------------------------------------------------------------------------

/**
 * ANALYTICS_DATE_RANGES — array for date range select/tab rendering.
 * vi: "Tùy chọn khoảng thời gian" / en: "Date range options"
 */
export const ANALYTICS_DATE_RANGES: readonly {
  value: "7d" | "30d" | "90d" | "custom";
  labelVi: string;
  labelEn: string;
  days?: number;
}[] = [
  { value: "7d", labelVi: "7 ngày qua", labelEn: "Last 7 days", days: 7 },
  { value: "30d", labelVi: "30 ngày qua", labelEn: "Last 30 days", days: 30 },
  { value: "90d", labelVi: "90 ngày qua", labelEn: "Last 90 days", days: 90 },
  { value: "custom", labelVi: "Tùy chỉnh", labelEn: "Custom range" },
] as const;

// TypeScript type inference exports
export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;
