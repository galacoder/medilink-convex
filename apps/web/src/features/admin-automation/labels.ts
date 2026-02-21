/**
 * Bilingual labels for the admin-automation feature module.
 *
 * WHY: All user-facing text must support Vietnamese (primary) and English
 * (secondary) per CLAUDE.md requirements. Centralizing labels here ensures
 * consistent terminology across all automation UI components.
 *
 * vi: "Nhãn tự động hóa nền tảng quản trị" / en: "Platform admin automation labels"
 */

export const automationLabels = {
  // ---------------------------------------------------------------------------
  // Page header
  // vi: "Tiêu đề trang" / en: "Page header"
  // ---------------------------------------------------------------------------
  page: {
    title: { vi: "Tự động hóa", en: "Automation" },
    description: {
      vi: "Quản lý và theo dõi các quy tắc tự động hóa nền tảng",
      en: "Manage and monitor platform automation rules",
    },
  },

  // ---------------------------------------------------------------------------
  // Rule names (human-readable)
  // vi: "Tên quy tắc (dễ đọc)" / en: "Rule names (human-readable)"
  // ---------------------------------------------------------------------------
  ruleNames: {
    checkOverdueRequests: {
      vi: "Kiểm tra yêu cầu quá hạn",
      en: "Check Overdue Requests",
    },
    checkMaintenanceDue: {
      vi: "Kiểm tra bảo trì sắp đến hạn",
      en: "Check Maintenance Due",
    },
    checkStockLevels: {
      vi: "Kiểm tra mức tồn kho",
      en: "Check Stock Levels",
    },
    checkCertificationExpiry: {
      vi: "Kiểm tra chứng nhận hết hạn",
      en: "Check Certification Expiry",
    },
    autoAssignProviders: {
      vi: "Tự động phân công nhà cung cấp",
      en: "Auto-assign Providers",
    },
  },

  // ---------------------------------------------------------------------------
  // Rule descriptions
  // vi: "Mô tả quy tắc" / en: "Rule descriptions"
  // ---------------------------------------------------------------------------
  ruleDescriptions: {
    checkOverdueRequests: {
      vi: "Phát hiện yêu cầu dịch vụ bị tắc nghẽn > 7 ngày và gửi cảnh báo",
      en: "Detects service requests stuck > 7 days and sends escalation alerts",
    },
    checkMaintenanceDue: {
      vi: "Nhắc nhở khi thiết bị có lịch bảo trì trong vòng 7 ngày tới",
      en: "Reminds when equipment maintenance is due within 7 days",
    },
    checkStockLevels: {
      vi: "Cảnh báo khi vật tư tiêu hao xuống dưới mức đặt hàng lại",
      en: "Alerts when consumable stock falls below reorder point",
    },
    checkCertificationExpiry: {
      vi: "Cảnh báo nhà cung cấp có chứng nhận hết hạn trong vòng 30 ngày",
      en: "Warns when provider certifications expire within 30 days",
    },
    autoAssignProviders: {
      vi: "Gợi ý nhà cung cấp phù hợp cho yêu cầu dịch vụ mới",
      en: "Suggests matching providers for new service requests",
    },
  },

  // ---------------------------------------------------------------------------
  // Cron schedules (display)
  // vi: "Lịch thực thi" / en: "Schedule display"
  // ---------------------------------------------------------------------------
  schedules: {
    checkOverdueRequests: {
      vi: "Mỗi giờ (lúc :30)",
      en: "Every hour (at :30)",
    },
    checkMaintenanceDue: {
      vi: "Hàng ngày lúc 08:00 UTC",
      en: "Daily at 08:00 UTC",
    },
    checkStockLevels: {
      vi: "Hàng ngày lúc 09:00 UTC",
      en: "Daily at 09:00 UTC",
    },
    checkCertificationExpiry: {
      vi: "Hàng tuần thứ Hai lúc 07:00 UTC",
      en: "Weekly Monday at 07:00 UTC",
    },
    autoAssignProviders: {
      vi: "Theo yêu cầu",
      en: "On-demand",
    },
  },

  // ---------------------------------------------------------------------------
  // Status labels
  // vi: "Nhãn trạng thái" / en: "Status labels"
  // ---------------------------------------------------------------------------
  status: {
    success: { vi: "Thành công", en: "Success" },
    error: { vi: "Lỗi", en: "Error" },
    never: { vi: "Chưa chạy", en: "Never run" },
  },

  // ---------------------------------------------------------------------------
  // Table columns
  // vi: "Cột bảng" / en: "Table columns"
  // ---------------------------------------------------------------------------
  table: {
    title: { vi: "Lịch sử thực thi", en: "Run History" },
    ruleName: { vi: "Quy tắc", en: "Rule" },
    status: { vi: "Trạng thái", en: "Status" },
    affectedCount: { vi: "Số bản ghi", en: "Affected" },
    runAt: { vi: "Thời gian chạy", en: "Run At" },
    errorMessage: { vi: "Lỗi", en: "Error" },
    noData: { vi: "Chưa có lịch sử chạy", en: "No run history yet" },
  },

  // ---------------------------------------------------------------------------
  // Rule status cards
  // vi: "Thẻ trạng thái quy tắc" / en: "Rule status cards"
  // ---------------------------------------------------------------------------
  cards: {
    title: { vi: "Trạng thái quy tắc", en: "Rule Status" },
    lastRun: { vi: "Lần chạy gần nhất", en: "Last Run" },
    affectedCount: { vi: "Bản ghi bị ảnh hưởng", en: "Affected Records" },
    schedule: { vi: "Lịch chạy", en: "Schedule" },
  },

  // ---------------------------------------------------------------------------
  // Loading / error states
  // vi: "Trạng thái tải / lỗi" / en: "Loading / error states"
  // ---------------------------------------------------------------------------
  states: {
    loading: { vi: "Đang tải...", en: "Loading..." },
    error: { vi: "Lỗi khi tải dữ liệu", en: "Error loading data" },
    noData: { vi: "Chưa có dữ liệu", en: "No data available" },
  },
} as const;
