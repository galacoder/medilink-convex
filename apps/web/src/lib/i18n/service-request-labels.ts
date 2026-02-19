/**
 * Bilingual labels for service request management pages.
 *
 * WHY: Centralized labels follow the same pattern as settings-labels.ts.
 * Vietnamese is primary (displayed by default), English is secondary
 * (used as fallback or in bilingual export reports).
 *
 * All UI strings for list, detail, create, quotes, timeline, and rating
 * sections live here to ensure consistent bilingual coverage.
 */
export const serviceRequestLabels = {
  // ---------------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------------
  pages: {
    list: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
    detail: { vi: "Chi tiết yêu cầu dịch vụ", en: "Service Request Detail" },
    create: { vi: "Tạo yêu cầu dịch vụ", en: "Create Service Request" },
  },

  // ---------------------------------------------------------------------------
  // Status names
  // ---------------------------------------------------------------------------
  status: {
    all: { vi: "Tất cả", en: "All" },
    pending: { vi: "Đang chờ", en: "Pending" },
    quoted: { vi: "Đã báo giá", en: "Quoted" },
    accepted: { vi: "Đã chấp nhận", en: "Accepted" },
    in_progress: { vi: "Đang thực hiện", en: "In Progress" },
    completed: { vi: "Hoàn thành", en: "Completed" },
    cancelled: { vi: "Đã hủy", en: "Cancelled" },
    disputed: { vi: "Đang tranh chấp", en: "Disputed" },
  },

  // ---------------------------------------------------------------------------
  // Priority names
  // ---------------------------------------------------------------------------
  priority: {
    low: { vi: "Thấp", en: "Low" },
    medium: { vi: "Trung bình", en: "Medium" },
    high: { vi: "Cao", en: "High" },
    critical: { vi: "Khẩn cấp", en: "Critical" },
  },

  // ---------------------------------------------------------------------------
  // Type names
  // ---------------------------------------------------------------------------
  type: {
    repair: { vi: "Sửa chữa", en: "Repair" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
    calibration: { vi: "Hiệu chỉnh", en: "Calibration" },
    inspection: { vi: "Kiểm tra", en: "Inspection" },
    installation: { vi: "Lắp đặt", en: "Installation" },
    other: { vi: "Khác", en: "Other" },
  },

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  table: {
    equipment: { vi: "Thiết bị", en: "Equipment" },
    type: { vi: "Loại dịch vụ", en: "Service Type" },
    priority: { vi: "Ưu tiên", en: "Priority" },
    status: { vi: "Trạng thái", en: "Status" },
    createdAt: { vi: "Ngày tạo", en: "Created At" },
    actions: { vi: "Thao tác", en: "Actions" },
    view: { vi: "Xem", en: "View" },
    empty: {
      vi: "Không có yêu cầu dịch vụ nào. Nhấn \"Tạo mới\" để bắt đầu.",
      en: "No service requests found. Click \"Create\" to get started.",
    },
  },

  // ---------------------------------------------------------------------------
  // Form fields
  // ---------------------------------------------------------------------------
  form: {
    steps: {
      equipment: { vi: "Chọn thiết bị", en: "Select Equipment" },
      issue: { vi: "Mô tả vấn đề", en: "Describe Issue" },
      review: { vi: "Xem lại và gửi", en: "Review & Submit" },
    },
    equipment: { vi: "Thiết bị", en: "Equipment" },
    equipmentPlaceholder: { vi: "Chọn thiết bị cần dịch vụ", en: "Select equipment to service" },
    issueType: { vi: "Loại vấn đề", en: "Issue Type" },
    priority: { vi: "Mức ưu tiên", en: "Priority" },
    description: { vi: "Mô tả chi tiết (tiếng Việt)", en: "Detailed description (Vietnamese)" },
    descriptionPlaceholder: {
      vi: "Mô tả vấn đề của thiết bị bằng tiếng Việt...",
      en: "Describe the equipment issue in Vietnamese...",
    },
    descriptionEn: { vi: "Mô tả chi tiết (tiếng Anh - tùy chọn)", en: "Detailed description (English - optional)" },
    descriptionEnPlaceholder: {
      vi: "Describe the equipment issue in English (optional)...",
      en: "Describe the equipment issue in English (optional)...",
    },
    scheduledDate: { vi: "Ngày dự kiến (tùy chọn)", en: "Scheduled Date (optional)" },
    reviewTitle: { vi: "Xem lại thông tin yêu cầu", en: "Review Request Details" },
  },

  // ---------------------------------------------------------------------------
  // Quote labels
  // ---------------------------------------------------------------------------
  quotes: {
    title: { vi: "Báo giá từ nhà cung cấp", en: "Provider Quotes" },
    empty: {
      vi: "Chưa có báo giá nào. Các nhà cung cấp sẽ gửi báo giá sớm.",
      en: "No quotes yet. Providers will submit quotes soon.",
    },
    amount: { vi: "Số tiền báo giá", en: "Quote Amount" },
    provider: { vi: "Nhà cung cấp", en: "Provider" },
    validUntil: { vi: "Có hiệu lực đến", en: "Valid Until" },
    notes: { vi: "Ghi chú", en: "Notes" },
    status: {
      pending: { vi: "Đang chờ", en: "Pending" },
      accepted: { vi: "Đã chấp nhận", en: "Accepted" },
      rejected: { vi: "Đã từ chối", en: "Rejected" },
      expired: { vi: "Đã hết hạn", en: "Expired" },
    },
    accept: { vi: "Chấp nhận báo giá", en: "Accept Quote" },
    reject: { vi: "Từ chối báo giá", en: "Reject Quote" },
    acceptConfirmTitle: { vi: "Xác nhận chấp nhận báo giá", en: "Confirm Accept Quote" },
    acceptConfirmDesc: {
      vi: "Bạn có chắc chắn muốn chấp nhận báo giá này? Các báo giá khác sẽ bị từ chối tự động.",
      en: "Are you sure you want to accept this quote? Other quotes will be automatically rejected.",
    },
    rejectConfirmTitle: { vi: "Xác nhận từ chối báo giá", en: "Confirm Reject Quote" },
    rejectConfirmDesc: {
      vi: "Bạn có chắc chắn muốn từ chối báo giá này?",
      en: "Are you sure you want to reject this quote?",
    },
    accepting: { vi: "Đang chấp nhận...", en: "Accepting..." },
    rejecting: { vi: "Đang từ chối...", en: "Rejecting..." },
  },

  // ---------------------------------------------------------------------------
  // Timeline labels
  // ---------------------------------------------------------------------------
  timeline: {
    title: { vi: "Tiến trình xử lý", en: "Progress Timeline" },
    steps: {
      pending: {
        label: { vi: "Yêu cầu đã gửi", en: "Request Submitted" },
        description: { vi: "Đang chờ báo giá từ nhà cung cấp", en: "Waiting for provider quotes" },
      },
      quoted: {
        label: { vi: "Đã nhận báo giá", en: "Quotes Received" },
        description: { vi: "Đang xem xét báo giá từ nhà cung cấp", en: "Reviewing provider quotes" },
      },
      accepted: {
        label: { vi: "Đã chấp nhận báo giá", en: "Quote Accepted" },
        description: { vi: "Nhà cung cấp đang chuẩn bị thực hiện dịch vụ", en: "Provider preparing to perform service" },
      },
      in_progress: {
        label: { vi: "Đang thực hiện", en: "Service In Progress" },
        description: { vi: "Nhà cung cấp đang thực hiện dịch vụ", en: "Provider is performing the service" },
      },
      completed: {
        label: { vi: "Hoàn thành", en: "Completed" },
        description: { vi: "Dịch vụ đã hoàn thành thành công", en: "Service has been completed successfully" },
      },
      cancelled: {
        label: { vi: "Đã hủy", en: "Cancelled" },
        description: { vi: "Yêu cầu dịch vụ đã bị hủy", en: "Service request was cancelled" },
      },
      disputed: {
        label: { vi: "Đang tranh chấp", en: "Disputed" },
        description: { vi: "Yêu cầu đang trong quá trình giải quyết tranh chấp", en: "Request is under dispute resolution" },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Rating labels
  // ---------------------------------------------------------------------------
  rating: {
    title: { vi: "Đánh giá dịch vụ", en: "Rate Service" },
    overall: { vi: "Đánh giá tổng thể", en: "Overall Rating" },
    serviceQuality: { vi: "Chất lượng dịch vụ", en: "Service Quality" },
    timeliness: { vi: "Đúng giờ", en: "Timeliness" },
    professionalism: { vi: "Chuyên nghiệp", en: "Professionalism" },
    comment: { vi: "Nhận xét (tiếng Việt)", en: "Comment (Vietnamese)" },
    commentPlaceholder: {
      vi: "Nhận xét về dịch vụ...",
      en: "Comment on the service...",
    },
    submit: { vi: "Gửi đánh giá", en: "Submit Rating" },
    submitting: { vi: "Đang gửi...", en: "Submitting..." },
    submitted: { vi: "Đã đánh giá", en: "Rated" },
    stars: { vi: "sao", en: "stars" },
    validation: {
      minStars: {
        vi: "Vui lòng chọn ít nhất 1 sao",
        en: "Please select at least 1 star",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Button labels
  // ---------------------------------------------------------------------------
  buttons: {
    create: { vi: "Tạo yêu cầu mới", en: "New Request" },
    cancel: { vi: "Hủy yêu cầu", en: "Cancel Request" },
    cancelConfirmTitle: { vi: "Hủy yêu cầu dịch vụ", en: "Cancel Service Request" },
    cancelConfirmDesc: {
      vi: "Bạn có chắc chắn muốn hủy yêu cầu dịch vụ này? Hành động này không thể hoàn tác.",
      en: "Are you sure you want to cancel this service request? This action cannot be undone.",
    },
    cancelling: { vi: "Đang hủy...", en: "Cancelling..." },
    back: { vi: "Quay lại", en: "Back" },
    next: { vi: "Tiếp theo", en: "Next" },
    submit: { vi: "Gửi yêu cầu", en: "Submit Request" },
    submitting: { vi: "Đang gửi...", en: "Submitting..." },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    close: { vi: "Đóng", en: "Close" },
    viewDetail: { vi: "Xem chi tiết", en: "View Details" },
  },

  // ---------------------------------------------------------------------------
  // Error and empty messages
  // ---------------------------------------------------------------------------
  errors: {
    loadFailed: {
      vi: "Không thể tải danh sách yêu cầu dịch vụ",
      en: "Failed to load service requests",
    },
    notFound: {
      vi: "Không tìm thấy yêu cầu dịch vụ",
      en: "Service request not found",
    },
    createFailed: {
      vi: "Không thể tạo yêu cầu dịch vụ",
      en: "Failed to create service request",
    },
    cancelFailed: {
      vi: "Không thể hủy yêu cầu dịch vụ",
      en: "Failed to cancel service request",
    },
    equipmentRequired: {
      vi: "Vui lòng chọn thiết bị",
      en: "Please select equipment",
    },
    descriptionRequired: {
      vi: "Vui lòng nhập mô tả vấn đề",
      en: "Please enter a description",
    },
  },

  // ---------------------------------------------------------------------------
  // Common / misc
  // ---------------------------------------------------------------------------
  common: {
    loading: { vi: "Đang tải...", en: "Loading..." },
    requestId: { vi: "Mã yêu cầu", en: "Request ID" },
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    equipment: { vi: "Thiết bị", en: "Equipment" },
    createdAt: { vi: "Ngày tạo", en: "Created At" },
    updatedAt: { vi: "Cập nhật lần cuối", en: "Last Updated" },
    scheduledAt: { vi: "Ngày dự kiến", en: "Scheduled Date" },
    completedAt: { vi: "Ngày hoàn thành", en: "Completed Date" },
    noDescription: { vi: "Không có mô tả", en: "No description" },
  },
} as const;

export type ServiceRequestLabels = typeof serviceRequestLabels;
