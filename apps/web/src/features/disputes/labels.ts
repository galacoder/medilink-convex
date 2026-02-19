/**
 * Bilingual labels for the disputes feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ tranh chấp" / en: "Dispute bilingual labels"
 */
export const disputeLabels = {
  // Page title
  title: { vi: "Khiếu nại", en: "Disputes" },
  subtitle: {
    vi: "Quản lý khiếu nại dịch vụ",
    en: "Service dispute management",
  },

  // Status labels
  statuses: {
    open: { vi: "Đang mở", en: "Open" },
    investigating: { vi: "Đang xem xét", en: "Under Review" },
    resolved: { vi: "Đã giải quyết", en: "Resolved" },
    closed: { vi: "Đã đóng", en: "Closed" },
    escalated: { vi: "Đã leo thang", en: "Escalated" },
  },

  // Type labels
  types: {
    quality: { vi: "Chất lượng", en: "Quality" },
    pricing: { vi: "Giá cả", en: "Pricing" },
    timeline: { vi: "Thời hạn", en: "Timeline" },
    other: { vi: "Khác", en: "Other" },
  },

  // Field labels
  fields: {
    id: { vi: "Mã khiếu nại", en: "Dispute ID" },
    type: { vi: "Loại khiếu nại", en: "Dispute Type" },
    status: { vi: "Trạng thái", en: "Status" },
    descriptionVi: { vi: "Mô tả (Tiếng Việt)", en: "Description (Vietnamese)" },
    descriptionEn: { vi: "Mô tả (Tiếng Anh)", en: "Description (English)" },
    serviceRequest: { vi: "Yêu cầu dịch vụ", en: "Service Request" },
    equipment: { vi: "Thiết bị", en: "Equipment" },
    organization: { vi: "Tổ chức", en: "Organization" },
    raisedBy: { vi: "Người tạo", en: "Raised By" },
    assignedTo: { vi: "Người phụ trách", en: "Assigned To" },
    createdAt: { vi: "Ngày tạo", en: "Created At" },
    updatedAt: { vi: "Cập nhật lần cuối", en: "Last Updated" },
    resolvedAt: { vi: "Ngày giải quyết", en: "Resolved At" },
    resolutionNotes: { vi: "Ghi chú giải quyết", en: "Resolution Notes" },
  },

  // Action labels
  actions: {
    create: { vi: "Tạo khiếu nại", en: "Raise Dispute" },
    submit: { vi: "Gửi", en: "Submit" },
    cancel: { vi: "Hủy", en: "Cancel" },
    escalate: { vi: "Leo thang", en: "Escalate" },
    resolve: { vi: "Giải quyết", en: "Resolve" },
    close: { vi: "Đóng", en: "Close" },
    sendMessage: { vi: "Gửi tin nhắn", en: "Send Message" },
    viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
    loadMore: { vi: "Tải thêm", en: "Load More" },
  },

  // Status filter tabs
  filterTabs: {
    all: { vi: "Tất cả", en: "All" },
    open: { vi: "Đang mở", en: "Open" },
    investigating: { vi: "Đang xem xét", en: "Under Review" },
    resolved: { vi: "Đã giải quyết", en: "Resolved" },
    escalated: { vi: "Đã leo thang", en: "Escalated" },
    closed: { vi: "Đã đóng", en: "Closed" },
  },

  // Empty states
  empty: {
    noDisputes: { vi: "Chưa có khiếu nại nào", en: "No disputes yet" },
    noDisputesDesc: {
      vi: "Tạo khiếu nại khi có vấn đề với yêu cầu dịch vụ",
      en: "Create a dispute when you have issues with a service request",
    },
    noMessages: { vi: "Chưa có tin nhắn nào", en: "No messages yet" },
    noMessagesDesc: {
      vi: "Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên",
      en: "Start the conversation by sending the first message",
    },
  },

  // Placeholders
  placeholders: {
    descriptionVi: {
      vi: "Mô tả chi tiết vấn đề...",
      en: "Describe the issue in detail...",
    },
    descriptionEn: {
      vi: "Mô tả bằng tiếng Anh (không bắt buộc)...",
      en: "Description in English (optional)...",
    },
    messageVi: {
      vi: "Nhập tin nhắn...",
      en: "Type a message...",
    },
    selectServiceRequest: {
      vi: "Chọn yêu cầu dịch vụ",
      en: "Select a service request",
    },
    selectType: {
      vi: "Chọn loại khiếu nại",
      en: "Select dispute type",
    },
    escalationReason: {
      vi: "Lý do leo thang...",
      en: "Reason for escalation...",
    },
  },

  // Form section titles
  form: {
    title: { vi: "Tạo khiếu nại mới", en: "Raise New Dispute" },
    serviceRequestLabel: {
      vi: "Yêu cầu dịch vụ liên quan",
      en: "Related Service Request",
    },
    typeLabel: { vi: "Loại khiếu nại", en: "Dispute Type" },
    descriptionLabel: { vi: "Mô tả vấn đề", en: "Problem Description" },
  },

  // Escalation dialog
  escalation: {
    title: { vi: "Leo thang khiếu nại", en: "Escalate Dispute" },
    description: {
      vi: "Leo thang sẽ chuyển khiếu nại này đến quản trị viên nền tảng để can thiệp. Thao tác này không thể hoàn tác.",
      en: "Escalating will forward this dispute to platform administrators for intervention. This action cannot be undone.",
    },
    reasonLabel: {
      vi: "Lý do leo thang (không bắt buộc)",
      en: "Escalation reason (optional)",
    },
    confirm: { vi: "Leo thang", en: "Escalate" },
    cancel: { vi: "Hủy", en: "Cancel" },
    disabledTooltip: {
      vi: "Chỉ có thể leo thang khiếu nại đang mở hoặc đang xem xét",
      en: "Can only escalate open or under-review disputes",
    },
  },

  // Loading states
  loading: { vi: "Đang tải...", en: "Loading..." },

  // Success/Error messages
  createSuccess: {
    vi: "Tạo khiếu nại thành công",
    en: "Dispute raised successfully",
  },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },

  // Breadcrumb
  backToList: { vi: "Danh sách khiếu nại", en: "Disputes" },

  // Message thread
  thread: {
    title: { vi: "Cuộc trò chuyện", en: "Message Thread" },
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    provider: { vi: "Nhà cung cấp", en: "Provider" },
  },

  // Detail page sections
  detail: {
    disputeInfo: { vi: "Thông tin khiếu nại", en: "Dispute Information" },
    statusInfo: { vi: "Trạng thái & Tiến trình", en: "Status & Progress" },
    linkedRequest: {
      vi: "Yêu cầu dịch vụ liên quan",
      en: "Linked Service Request",
    },
  },
} as const;
