/**
 * Bilingual labels for the admin audit log feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ nhật ký kiểm tra" / en: "Audit log bilingual labels"
 */
export const auditLogLabels = {
  // Page title
  title: { vi: "Nhật ký kiểm tra", en: "Audit Log" },
  subtitle: {
    vi: "Theo dõi tất cả các thay đổi trên nền tảng",
    en: "Track all platform-wide changes",
  },

  // Action type labels
  actionTypes: {
    create: { vi: "Tạo mới", en: "Create" },
    update: { vi: "Cập nhật", en: "Update" },
    delete: { vi: "Xóa", en: "Delete" },
    status_change: { vi: "Thay đổi trạng thái", en: "Status Change" },
  },

  // Resource type labels
  resourceTypes: {
    equipment: { vi: "Thiết bị", en: "Equipment" },
    service_request: { vi: "Yêu cầu dịch vụ", en: "Service Request" },
    quote: { vi: "Báo giá", en: "Quote" },
    dispute: { vi: "Khiếu nại", en: "Dispute" },
  },

  // Field labels for table columns
  fields: {
    timestamp: { vi: "Thời gian", en: "Timestamp" },
    actor: { vi: "Người thực hiện", en: "Actor" },
    action: { vi: "Hành động", en: "Action" },
    resourceType: { vi: "Loại tài nguyên", en: "Resource Type" },
    resourceId: { vi: "ID tài nguyên", en: "Resource ID" },
    organization: { vi: "Tổ chức", en: "Organization" },
    details: { vi: "Chi tiết", en: "Details" },
  },

  // Filter panel labels
  filters: {
    title: { vi: "Bộ lọc", en: "Filters" },
    actionType: { vi: "Loại hành động", en: "Action Type" },
    resourceType: { vi: "Loại tài nguyên", en: "Resource Type" },
    organization: { vi: "Tổ chức", en: "Organization" },
    actor: { vi: "Người thực hiện", en: "Actor" },
    dateFrom: { vi: "Từ ngày", en: "From Date" },
    dateTo: { vi: "Đến ngày", en: "To Date" },
    search: { vi: "Tìm kiếm", en: "Search" },
    searchPlaceholder: {
      vi: "Tìm kiếm theo hành động...",
      en: "Search by action...",
    },
    clearAll: { vi: "Xóa bộ lọc", en: "Clear All" },
    allActionTypes: { vi: "Tất cả hành động", en: "All Action Types" },
    allResourceTypes: { vi: "Tất cả tài nguyên", en: "All Resource Types" },
  },

  // Action buttons
  actions: {
    export: { vi: "Xuất CSV", en: "Export CSV" },
    viewDetail: { vi: "Xem chi tiết", en: "View Details" },
    loadMore: { vi: "Tải thêm", en: "Load More" },
    refresh: { vi: "Làm mới", en: "Refresh" },
  },

  // Retention info
  retention: {
    oldestEntry: { vi: "Bản ghi cũ nhất", en: "Oldest Entry" },
    totalEntries: { vi: "Tổng số bản ghi", en: "Total Entries" },
    retentionPolicy: {
      vi: "Lưu trữ 5 năm theo Nghị định 36/2016",
      en: "5-year retention per Decree 36/2016",
    },
  },

  // Empty states
  empty: {
    noEntries: { vi: "Chưa có bản ghi nào", en: "No audit entries found" },
    noEntriesDesc: {
      vi: "Không tìm thấy bản ghi kiểm tra phù hợp với bộ lọc đã chọn",
      en: "No audit entries match the current filters",
    },
  },

  // Loading states
  loading: { vi: "Đang tải...", en: "Loading..." },

  // Detail modal
  detail: {
    title: { vi: "Chi tiết bản ghi kiểm tra", en: "Audit Entry Details" },
    previousValues: { vi: "Giá trị trước", en: "Previous Values" },
    newValues: { vi: "Giá trị mới", en: "New Values" },
    payload: { vi: "Dữ liệu thay đổi", en: "Change Payload" },
    noPayload: { vi: "Không có dữ liệu thay đổi", en: "No change payload" },
  },
} as const;
