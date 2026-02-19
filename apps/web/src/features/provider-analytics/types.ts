/**
 * TypeScript interfaces for the provider-analytics feature module.
 *
 * WHY: These types mirror the Convex analytics query return shapes but are
 * frontend-specific. Using explicit interfaces ensures stable types that
 * don't break if the Convex return shape changes slightly.
 *
 * vi: "Kiểu dữ liệu phân tích nhà cung cấp" / en: "Provider analytics types"
 */

// ---------------------------------------------------------------------------
// Date range types
// ---------------------------------------------------------------------------

/** vi: "Khoảng thời gian" / en: "Date range preset" */
export type DateRangePreset = "7d" | "30d" | "90d" | "custom";

// ---------------------------------------------------------------------------
// Summary / KPI types
// ---------------------------------------------------------------------------

/**
 * Top-level KPI summary for the provider analytics dashboard.
 * vi: "Tổng quan KPI" / en: "KPI summary"
 */
export interface ProviderAnalyticsSummary {
  /** vi: "Tổng doanh thu (VND)" / en: "Total revenue (VND)" */
  totalRevenue: number;
  /** vi: "Số dịch vụ hoàn thành" / en: "Completed services count" */
  completedServices: number;
  /** vi: "Tỷ lệ hoàn thành (0–1)" / en: "Completion rate (0–1)" */
  completionRate: number;
  /** vi: "Dịch vụ tháng này" / en: "This month services" */
  thisMonthServices: number;
  /** vi: "Dịch vụ tháng trước" / en: "Last month services" */
  lastMonthServices: number;
  /** vi: "Tổng báo giá đã gửi" / en: "Total quotes submitted" */
  totalQuotesSubmitted: number;
  /** vi: "Tỷ lệ thắng báo giá (0–1)" / en: "Quote win rate (0–1)" */
  quoteWinRate: number;
  /** vi: "Thời gian phản hồi trung bình (ngày)" / en: "Avg quote response time (days)" */
  avgQuoteResponseTimeDays: number;
  /** vi: "Đánh giá trung bình (1–5)" / en: "Average rating (1–5)" */
  averageRating: number;
  /** vi: "Tổng số đánh giá" / en: "Total ratings count" */
  totalRatings: number;
}

// ---------------------------------------------------------------------------
// Revenue types
// ---------------------------------------------------------------------------

/** vi: "Doanh thu theo tháng" / en: "Monthly revenue data point" */
export interface MonthlyRevenue {
  /** vi: "Tháng (MM/YYYY)" / en: "Month label (MM/YYYY)" */
  month: string;
  /** vi: "Doanh thu (VND)" / en: "Revenue (VND)" */
  revenue: number;
  /** vi: "Số dịch vụ hoàn thành" / en: "Completed services count" */
  completedServices: number;
}

/** vi: "Doanh thu theo loại dịch vụ" / en: "Revenue by service type" */
export interface RevenueByType {
  /** vi: "Loại dịch vụ" / en: "Service type" */
  type: string;
  /** vi: "Doanh thu (VND)" / en: "Revenue (VND)" */
  revenue: number;
}

// ---------------------------------------------------------------------------
// Rating types
// ---------------------------------------------------------------------------

/** vi: "Phân phối đánh giá" / en: "Rating distribution entry" */
export interface RatingDistributionEntry {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
}

/** vi: "Đánh giá gần đây" / en: "Recent review" */
export interface RecentReview {
  _id: string;
  rating: number;
  commentVi?: string;
  commentEn?: string;
  serviceQuality?: number;
  timeliness?: number;
  professionalism?: number;
  createdAt: number;
  ratedByName: string | null;
  hospitalName: string | null;
  serviceRequestType: string | null;
}

/** vi: "Thống kê đánh giá" / en: "Rating statistics" */
export interface ProviderRatings {
  averageRating: number;
  totalRatings: number;
  distribution: RatingDistributionEntry[];
  recentReviews: RecentReview[];
}

// ---------------------------------------------------------------------------
// Hospital relationship types
// ---------------------------------------------------------------------------

/** vi: "Quan hệ bệnh viện" / en: "Hospital relationship" */
export interface HospitalRelationship {
  hospitalName: string;
  completedServices: number;
  totalRevenue: number;
  isRepeat: boolean;
}
