/**
 * TypeScript interfaces for the admin-analytics feature module.
 *
 * WHY: These types mirror the Convex admin analytics query return shapes but are
 * frontend-specific. Using explicit interfaces ensures stable types that
 * don't break if the Convex return shape changes.
 *
 * vi: "Kiểu dữ liệu phân tích nền tảng quản trị" / en: "Platform admin analytics types"
 */

// ---------------------------------------------------------------------------
// Date range types
// ---------------------------------------------------------------------------

/** vi: "Khoảng thời gian phân tích quản trị" / en: "Admin analytics date range preset" */
export type AdminDateRangePreset = "7d" | "30d" | "90d" | "ytd" | "custom";

// ---------------------------------------------------------------------------
// Overview stats types
// ---------------------------------------------------------------------------

/**
 * Platform overview KPI statistics.
 * vi: "Thống kê tổng quan nền tảng" / en: "Platform overview stats"
 */
export interface PlatformOverviewStats {
  /** vi: "Tổng bệnh viện" / en: "Total hospitals" */
  totalHospitals: number;
  /** vi: "Tổng nhà cung cấp" / en: "Total providers" */
  totalProviders: number;
  /** vi: "Tổng thiết bị" / en: "Total equipment" */
  totalEquipment: number;
  /** vi: "Tổng yêu cầu dịch vụ" / en: "Total service requests" */
  totalServiceRequests: number;
  /** vi: "Tổng doanh thu" / en: "Total revenue" */
  totalRevenue: number;
}

// ---------------------------------------------------------------------------
// Growth metrics types
// ---------------------------------------------------------------------------

/** vi: "Điểm dữ liệu tăng trưởng theo tháng" / en: "Monthly growth data point" */
export interface MonthlyGrowthPoint {
  /** vi: "Tháng (MM/YYYY)" / en: "Month label (MM/YYYY)" */
  month: string;
  /** vi: "Số lượng mới" / en: "New count" */
  count: number;
}

/** vi: "Chỉ số tăng trưởng" / en: "Growth metrics" */
export interface GrowthMetrics {
  /** vi: "Tăng trưởng bệnh viện" / en: "Hospital growth per month" */
  hospitalGrowth: MonthlyGrowthPoint[];
  /** vi: "Tăng trưởng nhà cung cấp" / en: "Provider growth per month" */
  providerGrowth: MonthlyGrowthPoint[];
}

// ---------------------------------------------------------------------------
// Service volume types
// ---------------------------------------------------------------------------

/** vi: "Khối lượng dịch vụ theo tháng" / en: "Monthly service volume data point" */
export interface MonthlyServiceVolume {
  /** vi: "Tháng (MM/YYYY)" / en: "Month label (MM/YYYY)" */
  month: string;
  /** vi: "Tổng yêu cầu" / en: "Total requests" */
  total: number;
  /** vi: "Hoàn thành" / en: "Completed" */
  completed: number;
  /** vi: "Đã hủy" / en: "Cancelled" */
  cancelled: number;
  /** vi: "Tỷ lệ hoàn thành" / en: "Completion rate (0-1)" */
  completionRate: number;
}

/** vi: "Chỉ số dịch vụ" / en: "Service metrics" */
export interface ServiceMetrics {
  /** vi: "Khối lượng dịch vụ theo tháng" / en: "Monthly service volume" */
  monthlyVolume: MonthlyServiceVolume[];
  /** vi: "Tỷ lệ hoàn thành tổng thể" / en: "Overall completion rate" */
  overallCompletionRate: number;
}

// ---------------------------------------------------------------------------
// Revenue types
// ---------------------------------------------------------------------------

/** vi: "Doanh thu theo bệnh viện" / en: "Revenue entry by hospital" */
export interface HospitalRevenueEntry {
  organizationId: string;
  organizationName: string;
  totalRevenue: number;
  serviceCount: number;
}

/** vi: "Doanh thu theo nhà cung cấp" / en: "Revenue entry by provider" */
export interface ProviderRevenueEntry {
  providerId: string;
  providerName: string;
  totalRevenue: number;
  serviceCount: number;
}

/** vi: "Thống kê doanh thu nền tảng" / en: "Platform revenue metrics" */
export interface RevenueMetrics {
  /** vi: "Tổng doanh thu" / en: "Total revenue" */
  totalRevenue: number;
  /** vi: "Giá trị dịch vụ trung bình" / en: "Average service value" */
  averageServiceValue: number;
  /** vi: "Doanh thu theo bệnh viện (top N)" / en: "Revenue by hospital (top N)" */
  revenueByHospital: HospitalRevenueEntry[];
  /** vi: "Doanh thu theo nhà cung cấp (top N)" / en: "Revenue by provider (top N)" */
  revenueByProvider: ProviderRevenueEntry[];
}

// ---------------------------------------------------------------------------
// Top performers types
// ---------------------------------------------------------------------------

/** vi: "Bệnh viện hàng đầu" / en: "Top hospital entry" */
export interface TopHospitalEntry {
  organizationId: string;
  organizationName: string;
  serviceRequestCount: number;
}

/** vi: "Nhà cung cấp hàng đầu" / en: "Top provider entry" */
export interface TopProviderEntry {
  providerId: string;
  providerName: string;
  providerNameEn: string;
  averageRating: number;
  totalRatings: number;
  completedServices: number;
}

/** vi: "Đơn vị hàng đầu" / en: "Top performers" */
export interface TopPerformers {
  /** vi: "Bệnh viện hàng đầu (theo hoạt động)" / en: "Top hospitals by activity" */
  topHospitals: TopHospitalEntry[];
  /** vi: "Nhà cung cấp hàng đầu (theo đánh giá)" / en: "Top providers by rating" */
  topProviders: TopProviderEntry[];
}

// ---------------------------------------------------------------------------
// Platform health types
// ---------------------------------------------------------------------------

/** vi: "Sức khỏe nền tảng" / en: "Platform health metrics" */
export interface PlatformHealthMetrics {
  /** vi: "Thời gian phản hồi báo giá trung bình (ngày)" / en: "Avg quote response time (days)" */
  avgQuoteResponseTimeDays: number;
  /** vi: "Thời gian giải quyết tranh chấp trung bình (ngày)" / en: "Avg dispute resolution time (days)" */
  avgDisputeResolutionTimeDays: number;
}
