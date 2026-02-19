/**
 * Bilingual labels for the admin-analytics feature module.
 *
 * WHY: All user-facing text must support Vietnamese (primary) and English
 * (secondary) per CLAUDE.md requirements. Centralizing labels here ensures
 * consistent terminology across all admin analytics UI components.
 *
 * vi: "Nhãn phân tích nền tảng quản trị" / en: "Platform admin analytics labels"
 */
export const adminAnalyticsLabels = {
  // ---------------------------------------------------------------------------
  // Page header
  // vi: "Tiêu đề trang" / en: "Page header"
  // ---------------------------------------------------------------------------
  page: {
    title: { vi: "Phân tích nền tảng", en: "Platform Analytics" },
    description: {
      vi: "Tổng quan về bệnh viện, nhà cung cấp, doanh thu và khối lượng dịch vụ",
      en: "Overview of hospitals, providers, revenue, and service volume",
    },
  },

  // ---------------------------------------------------------------------------
  // Overview KPI cards
  // vi: "Thẻ KPI tổng quan" / en: "Overview KPI cards"
  // ---------------------------------------------------------------------------
  overview: {
    title: { vi: "Tổng quan nền tảng", en: "Platform Overview" },
    totalHospitals: { vi: "Tổng bệnh viện", en: "Total Hospitals" },
    totalProviders: { vi: "Tổng nhà cung cấp", en: "Total Providers" },
    totalEquipment: { vi: "Tổng thiết bị", en: "Total Equipment" },
    totalServiceRequests: {
      vi: "Tổng yêu cầu dịch vụ",
      en: "Total Service Requests",
    },
    totalRevenue: { vi: "Tổng doanh thu", en: "Total Revenue" },
  },

  // ---------------------------------------------------------------------------
  // Growth section
  // vi: "Tăng trưởng" / en: "Growth"
  // ---------------------------------------------------------------------------
  growth: {
    title: { vi: "Tăng trưởng", en: "Growth" },
    hospitalGrowth: {
      vi: "Bệnh viện mới theo tháng",
      en: "New Hospitals per Month",
    },
    providerGrowth: {
      vi: "Nhà cung cấp mới theo tháng",
      en: "New Providers per Month",
    },
    newHospitals: { vi: "Bệnh viện mới", en: "New Hospitals" },
    newProviders: { vi: "Nhà cung cấp mới", en: "New Providers" },
  },

  // ---------------------------------------------------------------------------
  // Service volume section
  // vi: "Khối lượng dịch vụ" / en: "Service volume"
  // ---------------------------------------------------------------------------
  services: {
    title: { vi: "Khối lượng dịch vụ", en: "Service Volume" },
    monthlyVolume: {
      vi: "Yêu cầu dịch vụ theo tháng",
      en: "Service Requests per Month",
    },
    completionRate: {
      vi: "Tỷ lệ hoàn thành theo tháng",
      en: "Completion Rate Trend",
    },
    overallCompletionRate: {
      vi: "Tỷ lệ hoàn thành tổng thể",
      en: "Overall Completion Rate",
    },
    totalRequests: { vi: "Tổng yêu cầu", en: "Total Requests" },
    completed: { vi: "Hoàn thành", en: "Completed" },
    cancelled: { vi: "Đã hủy", en: "Cancelled" },
  },

  // ---------------------------------------------------------------------------
  // Revenue section
  // vi: "Doanh thu" / en: "Revenue"
  // ---------------------------------------------------------------------------
  revenue: {
    title: { vi: "Doanh thu nền tảng", en: "Platform Revenue" },
    totalRevenue: { vi: "Tổng doanh thu", en: "Total Revenue" },
    averageServiceValue: {
      vi: "Giá trị dịch vụ trung bình",
      en: "Average Service Value",
    },
    revenueByHospital: {
      vi: "Doanh thu theo bệnh viện",
      en: "Revenue by Hospital",
    },
    revenueByProvider: {
      vi: "Doanh thu theo nhà cung cấp",
      en: "Revenue by Provider",
    },
    currency: { vi: "VND", en: "VND" },
    noRevenue: { vi: "Chưa có doanh thu", en: "No revenue yet" },
  },

  // ---------------------------------------------------------------------------
  // Top performers section
  // vi: "Đơn vị hàng đầu" / en: "Top performers"
  // ---------------------------------------------------------------------------
  topPerformers: {
    title: { vi: "Đơn vị hàng đầu", en: "Top Performers" },
    topHospitals: {
      vi: "Top 5 bệnh viện (theo hoạt động)",
      en: "Top 5 Hospitals by Activity",
    },
    topProviders: {
      vi: "Top 5 nhà cung cấp (theo đánh giá)",
      en: "Top 5 Providers by Rating",
    },
    serviceRequests: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
    rating: { vi: "Đánh giá", en: "Rating" },
    completedServices: { vi: "Dịch vụ hoàn thành", en: "Completed Services" },
    noData: { vi: "Chưa có dữ liệu", en: "No data yet" },
  },

  // ---------------------------------------------------------------------------
  // Platform health section
  // vi: "Sức khỏe nền tảng" / en: "Platform health"
  // ---------------------------------------------------------------------------
  health: {
    title: { vi: "Sức khỏe nền tảng", en: "Platform Health" },
    avgQuoteResponseTime: {
      vi: "Thời gian phản hồi báo giá TB",
      en: "Avg Quote Response Time",
    },
    avgDisputeResolutionTime: {
      vi: "Thời gian giải quyết tranh chấp TB",
      en: "Avg Dispute Resolution Time",
    },
    days: { vi: "ngày", en: "days" },
  },

  // ---------------------------------------------------------------------------
  // Date range filter
  // vi: "Lọc khoảng thời gian" / en: "Date range filter"
  // ---------------------------------------------------------------------------
  dateRange: {
    label: { vi: "Khoảng thời gian", en: "Date Range" },
    last7Days: { vi: "7 ngày", en: "7 days" },
    last30Days: { vi: "30 ngày", en: "30 days" },
    last90Days: { vi: "90 ngày", en: "90 days" },
    yearToDate: { vi: "Từ đầu năm", en: "Year-to-date" },
    custom: { vi: "Tùy chỉnh", en: "Custom" },
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
