/**
 * Bilingual labels for admin billing payment management.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhan song ngu quan ly thanh toan" / en: "Payment management bilingual labels"
 */
export const adminPaymentLabels = {
  // Page titles
  title: { vi: "Quản lý thanh toán", en: "Payment Management" },
  subtitle: {
    vi: "Ghi nhận, xác nhận và quản lý thanh toán chuyển khoản",
    en: "Record, confirm and manage bank transfer payments",
  },
  recordTitle: { vi: "Ghi nhận thanh toán", en: "Record Payment" },
  recordSubtitle: {
    vi: "Ghi nhận thanh toán chuyển khoản ngân hàng mới",
    en: "Record a new bank transfer payment",
  },
  detailTitle: { vi: "Chi tiết thanh toán", en: "Payment Detail" },

  // Status labels (with badge color hints)
  statuses: {
    pending: { vi: "Chờ xác nhận", en: "Pending" },
    confirmed: { vi: "Đã xác nhận", en: "Confirmed" },
    rejected: { vi: "Từ chối", en: "Rejected" },
    refunded: { vi: "Hoàn tiền", en: "Refunded" },
  },

  // Payment method labels
  methods: {
    bank_transfer: { vi: "Chuyển khoản ngân hàng", en: "Bank Transfer" },
    cash: { vi: "Tiền mặt", en: "Cash" },
    momo: { vi: "MoMo", en: "MoMo" },
    vnpay: { vi: "VNPay", en: "VNPay" },
    other: { vi: "Khác", en: "Other" },
  },

  // Payment type labels
  types: {
    subscription_new: { vi: "Đăng ký mới", en: "New Subscription" },
    subscription_renewal: { vi: "Gia hạn", en: "Renewal" },
    ai_credits: { vi: "Credit AI", en: "AI Credits" },
    upgrade: { vi: "Nâng cấp gói", en: "Upgrade" },
    other: { vi: "Khác", en: "Other" },
  },

  // Field labels
  fields: {
    organization: { vi: "Tổ chức", en: "Organization" },
    amount: { vi: "Số tiền (VND)", en: "Amount (VND)" },
    paymentMethod: { vi: "Phương thức thanh toán", en: "Payment Method" },
    paymentType: { vi: "Loại thanh toán", en: "Payment Type" },
    bankReference: { vi: "Mã giao dịch ngân hàng", en: "Bank Reference" },
    bankName: { vi: "Tên ngân hàng", en: "Bank Name" },
    transferDate: { vi: "Ngày chuyển khoản", en: "Transfer Date" },
    invoiceNumber: { vi: "Số hóa đơn", en: "Invoice Number" },
    notes: { vi: "Ghi chú", en: "Notes" },
    status: { vi: "Trạng thái", en: "Status" },
    date: { vi: "Ngày", en: "Date" },
    actions: { vi: "Thao tác", en: "Actions" },
    confirmedBy: { vi: "Xác nhận bởi", en: "Confirmed By" },
    confirmedAt: { vi: "Ngày xác nhận", en: "Confirmed At" },
    rejectionReason: { vi: "Lý do từ chối", en: "Rejection Reason" },
    subscription: { vi: "Đăng ký liên kết", en: "Linked Subscription" },
  },

  // Action labels
  actions: {
    recordPayment: { vi: "Ghi nhận thanh toán", en: "Record Payment" },
    confirmPayment: { vi: "Xác nhận thanh toán", en: "Confirm Payment" },
    savePending: { vi: "Lưu chờ xác nhận", en: "Save as Pending" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    reject: { vi: "Từ chối", en: "Reject" },
    void: { vi: "Hủy thanh toán", en: "Void Payment" },
    viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
    back: { vi: "Quay lại", en: "Back" },
    cancel: { vi: "Hủy", en: "Cancel" },
    submit: { vi: "Gửi", en: "Submit" },
  },

  // Filter labels
  filters: {
    allStatuses: { vi: "Tất cả trạng thái", en: "All Statuses" },
    searchPlaceholder: {
      vi: "Tìm kiếm tên tổ chức hoặc số hóa đơn...",
      en: "Search organization name or invoice number...",
    },
  },

  // Dialog labels
  dialogs: {
    reject: {
      title: { vi: "Từ chối thanh toán", en: "Reject Payment" },
      description: {
        vi: "Vui lòng nhập lý do từ chối thanh toán này.",
        en: "Please enter the reason for rejecting this payment.",
      },
      reasonLabel: { vi: "Lý do từ chối", en: "Rejection Reason" },
      reasonPlaceholder: {
        vi: "Nhập lý do từ chối...",
        en: "Enter rejection reason...",
      },
    },
    void: {
      title: { vi: "Hủy thanh toán", en: "Void Payment" },
      description: {
        vi: "Hành động này sẽ chuyển thanh toán sang trạng thái hoàn tiền. Bạn cần xử lý đăng ký liên quan riêng.",
        en: "This will mark the payment as refunded. You must handle the linked subscription separately.",
      },
      reasonLabel: { vi: "Lý do hủy", en: "Void Reason" },
      reasonPlaceholder: {
        vi: "Nhập lý do hủy thanh toán...",
        en: "Enter reason for voiding payment...",
      },
    },
    confirm: {
      title: { vi: "Xác nhận thanh toán", en: "Confirm Payment" },
      description: {
        vi: "Bạn có chắc chắn muốn xác nhận thanh toán này?",
        en: "Are you sure you want to confirm this payment?",
      },
    },
  },

  // Empty states
  empty: {
    noPayments: { vi: "Chưa có thanh toán nào", en: "No payments yet" },
    noPaymentsDesc: {
      vi: "Ghi nhận thanh toán đầu tiên để bắt đầu",
      en: "Record the first payment to get started",
    },
  },

  // Loading / error states
  loading: { vi: "Đang tải...", en: "Loading..." },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },

  // Success messages
  recordSuccess: {
    vi: "Ghi nhận thanh toán thành công",
    en: "Payment recorded successfully",
  },
  confirmSuccess: {
    vi: "Xác nhận thanh toán thành công",
    en: "Payment confirmed successfully",
  },
  rejectSuccess: {
    vi: "Từ chối thanh toán thành công",
    en: "Payment rejected successfully",
  },
  voidSuccess: {
    vi: "Hủy thanh toán thành công",
    en: "Payment voided successfully",
  },

  // Placeholders
  placeholders: {
    organization: {
      vi: "Chọn tổ chức...",
      en: "Select organization...",
    },
    amount: {
      vi: "ví dụ: 10800000",
      en: "e.g., 10,800,000",
    },
    bankReference: {
      vi: "ví dụ: FT26055XXXXX",
      en: "e.g., FT26055XXXXX",
    },
    bankName: {
      vi: "ví dụ: Vietcombank",
      en: "e.g., Vietcombank",
    },
    notes: {
      vi: "Ghi chú thêm về thanh toán...",
      en: "Additional notes about the payment...",
    },
  },
} as const;
