/**
 * Bilingual labels for the admin-disputes feature module.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ cho quản trị tranh chấp"
 * en: "Bilingual labels for admin dispute arbitration"
 */
export const adminDisputeLabels = {
  // Page titles
  titles: {
    serviceRequests: {
      vi: "Yêu cầu dịch vụ toàn nền tảng",
      en: "Platform-Wide Service Requests",
    },
    escalatedDisputes: {
      vi: "Tranh chấp leo thang",
      en: "Escalated Disputes",
    },
    disputeDetail: {
      vi: "Chi tiết tranh chấp & Trọng tài",
      en: "Dispute Detail & Arbitration",
    },
    arbitrationHistory: {
      vi: "Lịch sử trọng tài",
      en: "Arbitration History",
    },
  },

  // Table column headers
  columns: {
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    provider: { vi: "Nhà cung cấp", en: "Provider" },
    status: { vi: "Trạng thái", en: "Status" },
    type: { vi: "Loại", en: "Type" },
    priority: { vi: "Ưu tiên", en: "Priority" },
    createdAt: { vi: "Ngày tạo", en: "Created" },
    updatedAt: { vi: "Cập nhật", en: "Updated" },
    bottleneck: { vi: "Tắc nghẽn", en: "Bottleneck" },
    description: { vi: "Mô tả", en: "Description" },
    actions: { vi: "Hành động", en: "Actions" },
  },

  // Service request status labels
  serviceRequestStatuses: {
    pending: { vi: "Đang chờ", en: "Pending" },
    quoted: { vi: "Đã báo giá", en: "Quoted" },
    accepted: { vi: "Đã chấp nhận", en: "Accepted" },
    in_progress: { vi: "Đang thực hiện", en: "In Progress" },
    completed: { vi: "Hoàn thành", en: "Completed" },
    cancelled: { vi: "Đã hủy", en: "Cancelled" },
    disputed: { vi: "Đang tranh chấp", en: "Disputed" },
  },

  // Dispute status labels
  disputeStatuses: {
    open: { vi: "Đang mở", en: "Open" },
    investigating: { vi: "Đang điều tra", en: "Investigating" },
    resolved: { vi: "Đã giải quyết", en: "Resolved" },
    closed: { vi: "Đã đóng", en: "Closed" },
    escalated: { vi: "Đã leo thang", en: "Escalated" },
  },

  // Resolution type labels
  resolutionTypes: {
    refund: { vi: "Hoàn tiền đầy đủ", en: "Full Refund" },
    partial_refund: { vi: "Hoàn tiền một phần", en: "Partial Refund" },
    dismiss: { vi: "Bác bỏ khiếu nại", en: "Dismiss Dispute" },
    re_assign: { vi: "Phân công lại nhà cung cấp", en: "Re-assign Provider" },
  },

  // Bottleneck labels
  bottleneck: {
    badge: { vi: "Tắc nghẽn", en: "Bottleneck" },
    tooltip: {
      vi: "Yêu cầu này đã ở trạng thái hiện tại hơn 7 ngày",
      en: "This request has been in the current status for more than 7 days",
    },
  },

  // Arbitration panel
  arbitration: {
    title: { vi: "Trọng tài khiếu nại", en: "Dispute Arbitration" },
    hospitalPerspective: {
      vi: "Quan điểm bệnh viện",
      en: "Hospital Perspective",
    },
    providerPerspective: {
      vi: "Quan điểm nhà cung cấp",
      en: "Provider Perspective",
    },
    evidence: { vi: "Bằng chứng", en: "Evidence" },
    messageThread: { vi: "Luồng tin nhắn", en: "Message Thread" },
    ruling: { vi: "Phán quyết", en: "Ruling" },
    resolutionType: { vi: "Loại giải quyết", en: "Resolution Type" },
    reasonVi: { vi: "Lý do (Tiếng Việt)", en: "Reason (Vietnamese)" },
    reasonEn: { vi: "Lý do (Tiếng Anh)", en: "Reason (English)" },
    refundAmount: { vi: "Số tiền hoàn trả (VND)", en: "Refund Amount (VND)" },
    submitRuling: { vi: "Xác nhận phán quyết", en: "Submit Ruling" },
    cancel: { vi: "Hủy", en: "Cancel" },
    confirmTitle: {
      vi: "Xác nhận phán quyết trọng tài",
      en: "Confirm Arbitration Ruling",
    },
    confirmDescription: {
      vi: "Phán quyết này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?",
      en: "This ruling cannot be undone. Are you sure you want to proceed?",
    },
  },

  // Reassign provider panel
  reassign: {
    title: { vi: "Phân công lại nhà cung cấp", en: "Reassign Provider" },
    selectProvider: { vi: "Chọn nhà cung cấp mới", en: "Select New Provider" },
    reason: { vi: "Lý do phân công lại", en: "Reassignment Reason" },
    submit: { vi: "Xác nhận phân công lại", en: "Confirm Reassignment" },
    cancel: { vi: "Hủy", en: "Cancel" },
  },

  // Filter labels
  filters: {
    title: { vi: "Bộ lọc", en: "Filters" },
    status: { vi: "Trạng thái", en: "Status" },
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    provider: { vi: "Nhà cung cấp", en: "Provider" },
    dateRange: { vi: "Khoảng thời gian", en: "Date Range" },
    showBottlenecksOnly: {
      vi: "Chỉ hiển thị tắc nghẽn",
      en: "Show Bottlenecks Only",
    },
    allStatuses: { vi: "Tất cả trạng thái", en: "All Statuses" },
    allHospitals: { vi: "Tất cả bệnh viện", en: "All Hospitals" },
    allProviders: { vi: "Tất cả nhà cung cấp", en: "All Providers" },
    reset: { vi: "Đặt lại", en: "Reset Filters" },
  },

  // Empty states
  empty: {
    noServiceRequests: {
      vi: "Không có yêu cầu dịch vụ nào",
      en: "No service requests found",
    },
    noEscalatedDisputes: {
      vi: "Không có tranh chấp leo thang nào",
      en: "No escalated disputes found",
    },
    noArbitrationHistory: {
      vi: "Chưa có lịch sử trọng tài",
      en: "No arbitration history yet",
    },
  },

  // Actions
  actions: {
    viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
    arbitrate: { vi: "Trọng tài", en: "Arbitrate" },
    reassignProvider: { vi: "Phân công lại", en: "Reassign Provider" },
    viewServiceRequest: {
      vi: "Xem yêu cầu dịch vụ",
      en: "View Service Request",
    },
    backToDisputes: { vi: "Quay lại danh sách", en: "Back to List" },
  },

  // Loading / error
  loading: { vi: "Đang tải...", en: "Loading..." },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },
  successRuling: {
    vi: "Phán quyết đã được ghi nhận thành công",
    en: "Ruling submitted successfully",
  },
  successReassign: {
    vi: "Phân công lại thành công",
    en: "Provider reassigned successfully",
  },
} as const;
