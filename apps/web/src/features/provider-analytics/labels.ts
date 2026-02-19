/**
 * Bilingual labels for the provider-analytics feature module.
 *
 * WHY: All user-facing text must support Vietnamese (primary) and English
 * (secondary) per CLAUDE.md requirements. Centralizing labels here ensures
 * consistent terminology across all analytics UI components.
 *
 * vi: "Nhãn phân tích nhà cung cấp" / en: "Provider analytics labels"
 */
export const analyticsLabels = {
  // ---------------------------------------------------------------------------
  // Page header
  // vi: "Tiêu đề trang" / en: "Page header"
  // ---------------------------------------------------------------------------
  page: {
    title: { vi: "Phân tích kinh doanh", en: "Business Analytics" },
    description: {
      vi: "Tổng quan về doanh thu, tỷ lệ hoàn thành và đánh giá của bạn",
      en: "Overview of your revenue, completion rates, and ratings",
    },
  },

  // ---------------------------------------------------------------------------
  // Date range filter
  // vi: "Lọc khoảng thời gian" / en: "Date range filter"
  // ---------------------------------------------------------------------------
  dateRange: {
    label: { vi: "Khoảng thời gian", en: "Date Range" },
    last7Days: { vi: "7 ngày qua", en: "Last 7 days" },
    last30Days: { vi: "30 ngày qua", en: "Last 30 days" },
    last90Days: { vi: "90 ngày qua", en: "Last 90 days" },
    custom: { vi: "Tùy chỉnh", en: "Custom" },
  },

  // ---------------------------------------------------------------------------
  // Revenue section
  // vi: "Doanh thu" / en: "Revenue"
  // ---------------------------------------------------------------------------
  revenue: {
    title: { vi: "Doanh thu", en: "Revenue" },
    totalRevenue: { vi: "Tổng doanh thu", en: "Total Revenue" },
    revenueByMonth: { vi: "Doanh thu theo tháng", en: "Revenue by Month" },
    revenueByType: {
      vi: "Doanh thu theo loại dịch vụ",
      en: "Revenue by Service Type",
    },
    currency: { vi: "VND", en: "VND" },
    noRevenue: { vi: "Chưa có doanh thu", en: "No revenue yet" },
  },

  // ---------------------------------------------------------------------------
  // Service metrics section
  // vi: "Chỉ số dịch vụ" / en: "Service metrics"
  // ---------------------------------------------------------------------------
  services: {
    title: { vi: "Chỉ số dịch vụ", en: "Service Metrics" },
    completionRate: { vi: "Tỷ lệ hoàn thành", en: "Completion Rate" },
    completedServices: { vi: "Dịch vụ hoàn thành", en: "Completed Services" },
    thisMonth: { vi: "Tháng này", en: "This month" },
    lastMonth: { vi: "Tháng trước", en: "Last month" },
    vsLastMonth: { vi: "so với tháng trước", en: "vs last month" },
  },

  // ---------------------------------------------------------------------------
  // Rating section
  // vi: "Đánh giá" / en: "Ratings"
  // ---------------------------------------------------------------------------
  ratings: {
    title: { vi: "Đánh giá từ bệnh viện", en: "Hospital Ratings" },
    averageRating: { vi: "Đánh giá trung bình", en: "Average Rating" },
    totalRatings: { vi: "Tổng số đánh giá", en: "Total Ratings" },
    distribution: { vi: "Phân phối đánh giá", en: "Rating Distribution" },
    recentReviews: { vi: "Đánh giá gần đây", en: "Recent Reviews" },
    noRatings: { vi: "Chưa có đánh giá", en: "No ratings yet" },
    stars: { vi: "sao", en: "stars" },
    serviceQuality: { vi: "Chất lượng dịch vụ", en: "Service Quality" },
    timeliness: { vi: "Đúng giờ", en: "Timeliness" },
    professionalism: { vi: "Chuyên nghiệp", en: "Professionalism" },
  },

  // ---------------------------------------------------------------------------
  // Quote / response metrics
  // vi: "Chỉ số báo giá" / en: "Quote metrics"
  // ---------------------------------------------------------------------------
  quotes: {
    title: { vi: "Chỉ số báo giá", en: "Quote Metrics" },
    totalSubmitted: { vi: "Tổng báo giá đã gửi", en: "Total Quotes Submitted" },
    winRate: { vi: "Tỷ lệ thắng", en: "Win Rate" },
    avgResponseTime: { vi: "Thời gian phản hồi TB", en: "Avg Response Time" },
    days: { vi: "ngày", en: "days" },
  },

  // ---------------------------------------------------------------------------
  // Hospital relationships section
  // vi: "Quan hệ bệnh viện" / en: "Hospital relationships"
  // ---------------------------------------------------------------------------
  hospitals: {
    title: { vi: "Bệnh viện hàng đầu", en: "Top Hospitals" },
    hospitalName: { vi: "Bệnh viện", en: "Hospital" },
    completedServices: { vi: "Dịch vụ hoàn thành", en: "Completed Services" },
    totalRevenue: { vi: "Doanh thu", en: "Revenue" },
    repeatClient: { vi: "Khách hàng thân thiết", en: "Repeat Client" },
    noHospitals: {
      vi: "Chưa có bệnh viện",
      en: "No hospital relationships yet",
    },
  },

  // ---------------------------------------------------------------------------
  // Export section
  // vi: "Xuất dữ liệu" / en: "Data export"
  // ---------------------------------------------------------------------------
  export: {
    button: { vi: "Xuất CSV", en: "Export CSV" },
    exporting: { vi: "Đang xuất...", en: "Exporting..." },
    success: { vi: "Xuất thành công", en: "Export successful" },
  },

  // ---------------------------------------------------------------------------
  // Loading / error states
  // vi: "Trạng thái" / en: "States"
  // ---------------------------------------------------------------------------
  states: {
    loading: { vi: "Đang tải dữ liệu...", en: "Loading data..." },
    noData: { vi: "Chưa có dữ liệu", en: "No data available" },
    error: { vi: "Có lỗi xảy ra khi tải dữ liệu", en: "Error loading data" },
  },
} as const;
