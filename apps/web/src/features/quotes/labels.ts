/**
 * Bilingual labels for the provider-side quotes feature UI.
 *
 * WHY: All UI strings must be centralized here so Vietnamese (primary) and
 * English (secondary) labels stay consistent across pages, forms, and
 * empty states. Components import from this file instead of hardcoding strings.
 *
 * Pattern: { vi: "Vietnamese text", en: "English text" }
 */

export const quoteLabels = {
  page: {
    incomingRequests: {
      vi: "Yêu cầu dịch vụ mới",
      en: "Incoming Requests",
    },
    myQuotes: {
      vi: "Báo giá của tôi",
      en: "My Quotes",
    },
    requestDetail: {
      vi: "Chi tiết yêu cầu dịch vụ",
      en: "Service Request Detail",
    },
  },
  status: {
    pending: { vi: "Chờ phản hồi", en: "Pending" },
    accepted: { vi: "Được chấp nhận", en: "Accepted" },
    rejected: { vi: "Bị từ chối", en: "Rejected" },
    expired: { vi: "Hết hạn", en: "Expired" },
  },
  requestStatus: {
    pending: { vi: "Đang chờ", en: "Pending" },
    quoted: { vi: "Đã báo giá", en: "Quoted" },
    accepted: { vi: "Đã chấp nhận", en: "Accepted" },
    in_progress: { vi: "Đang thực hiện", en: "In Progress" },
    completed: { vi: "Hoàn thành", en: "Completed" },
    cancelled: { vi: "Đã hủy", en: "Cancelled" },
    disputed: { vi: "Đang tranh chấp", en: "Disputed" },
  },
  priority: {
    low: { vi: "Thấp", en: "Low" },
    medium: { vi: "Trung bình", en: "Medium" },
    high: { vi: "Cao", en: "High" },
    critical: { vi: "Khẩn cấp", en: "Critical" },
  },
  requestType: {
    repair: { vi: "Sửa chữa", en: "Repair" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
    calibration: { vi: "Hiệu chỉnh", en: "Calibration" },
    inspection: { vi: "Kiểm tra", en: "Inspection" },
    installation: { vi: "Lắp đặt", en: "Installation" },
    other: { vi: "Khác", en: "Other" },
  },
  actions: {
    submitQuote: { vi: "Gửi báo giá", en: "Submit Quote" },
    declineRequest: { vi: "Từ chối yêu cầu", en: "Decline Request" },
    viewDetail: { vi: "Xem chi tiết", en: "View Details" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    cancel: { vi: "Hủy", en: "Cancel" },
    back: { vi: "Quay lại", en: "Back" },
  },
  form: {
    amount: { vi: "Số tiền (VNĐ)", en: "Amount (VND)" },
    amountPlaceholder: { vi: "Nhập số tiền", en: "Enter amount" },
    estimatedDays: { vi: "Số ngày ước tính", en: "Estimated Days" },
    estimatedDaysPlaceholder: { vi: "Nhập số ngày", en: "Enter number of days" },
    startDate: { vi: "Ngày bắt đầu dự kiến", en: "Available Start Date" },
    notes: { vi: "Ghi chú cho bệnh viện", en: "Notes for Hospital" },
    notesPlaceholder: {
      vi: "Thêm ghi chú hoặc câu hỏi...",
      en: "Add notes or questions...",
    },
    terms: { vi: "Điều khoản dịch vụ", en: "Service Terms" },
    termsPlaceholder: {
      vi: "Nhập điều khoản và điều kiện...",
      en: "Enter terms and conditions...",
    },
    declineReason: { vi: "Lý do từ chối", en: "Decline Reason" },
    declineReasonPlaceholder: {
      vi: "Vui lòng nêu rõ lý do từ chối yêu cầu này...",
      en: "Please explain why you are declining this request...",
    },
  },
  dashboard: {
    pendingQuotes: { vi: "Báo giá đang chờ", en: "Pending Quotes" },
    acceptedQuotes: { vi: "Báo giá được chấp nhận", en: "Accepted Quotes" },
    rejectedQuotes: { vi: "Báo giá bị từ chối", en: "Rejected Quotes" },
    winRate: { vi: "Tỷ lệ thắng", en: "Win Rate" },
    totalQuotes: { vi: "Tổng số báo giá", en: "Total Quotes" },
  },
  emptyState: {
    noIncomingRequests: {
      vi: "Không có yêu cầu dịch vụ nào",
      en: "No incoming requests",
    },
    noIncomingRequestsDescription: {
      vi: "Chưa có yêu cầu dịch vụ nào từ bệnh viện",
      en: "No service requests from hospitals yet",
    },
    noQuotes: {
      vi: "Chưa có báo giá nào",
      en: "No quotes yet",
    },
    noQuotesDescription: {
      vi: "Báo giá của bạn sẽ xuất hiện ở đây sau khi gửi",
      en: "Your submitted quotes will appear here",
    },
  },
  confirmSubmit: {
    title: { vi: "Xác nhận gửi báo giá", en: "Confirm Quote Submission" },
    description: {
      vi: "Bạn có chắc chắn muốn gửi báo giá này? Bệnh viện sẽ nhận được thông báo ngay lập tức.",
      en: "Are you sure you want to submit this quote? The hospital will be notified immediately.",
    },
  },
  confirmDecline: {
    title: { vi: "Xác nhận từ chối yêu cầu", en: "Confirm Decline Request" },
    description: {
      vi: "Bạn có chắc chắn muốn từ chối yêu cầu dịch vụ này?",
      en: "Are you sure you want to decline this service request?",
    },
  },
  info: {
    equipment: { vi: "Thiết bị", en: "Equipment" },
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    description: { vi: "Mô tả sự cố", en: "Issue Description" },
    priority: { vi: "Mức độ ưu tiên", en: "Priority" },
    type: { vi: "Loại dịch vụ", en: "Service Type" },
    createdAt: { vi: "Ngày tạo", en: "Created" },
  },
};
