/**
 * Bilingual labels for admin billing feature.
 *
 * vi: "Nhan song ngu cho tinh nang thanh toan admin"
 * en: "Bilingual labels for admin billing feature"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */

export const billingLabels = {
  // Page titles
  title: {
    vi: "Quản lý đăng ký",
    en: "Subscription Management",
  },
  subtitle: {
    vi: "Quản lý gói đăng ký của tất cả tổ chức",
    en: "Manage subscriptions for all organizations",
  },
  detailTitle: {
    vi: "Chi tiết đăng ký",
    en: "Subscription Detail",
  },
  activateTitle: {
    vi: "Kích hoạt đăng ký",
    en: "Activate Subscription",
  },
  extendTitle: {
    vi: "Gia hạn đăng ký",
    en: "Extend Subscription",
  },

  // Status labels
  statusActive: { vi: "Đang hoạt động", en: "Active" },
  statusTrial: { vi: "Dùng thử", en: "Trial" },
  statusGracePeriod: { vi: "Gia hạn", en: "Grace Period" },
  statusExpired: { vi: "Hết hạn", en: "Expired" },
  statusSuspended: { vi: "Tạm ngưng", en: "Suspended" },

  // Plan labels
  planStarter: { vi: "Gói cơ bản", en: "Starter" },
  planProfessional: { vi: "Gói chuyên nghiệp", en: "Professional" },
  planEnterprise: { vi: "Gói doanh nghiệp", en: "Enterprise" },
  planTrial: { vi: "Gói dùng thử", en: "Trial" },

  // Billing cycle labels
  cycle3: { vi: "3 tháng", en: "3 months" },
  cycle6: { vi: "6 tháng", en: "6 months" },
  cycle12: { vi: "12 tháng", en: "12 months" },

  // Table headers
  organization: { vi: "Tổ chức", en: "Organization" },
  plan: { vi: "Gói", en: "Plan" },
  status: { vi: "Trạng thái", en: "Status" },
  expires: { vi: "Hết hạn", en: "Expires" },
  actions: { vi: "Thao tác", en: "Actions" },
  staffSeats: { vi: "Nhân viên", en: "Staff Seats" },
  equipment: { vi: "Thiết bị", en: "Equipment" },
  aiCredits: { vi: "Credit AI", en: "AI Credits" },

  // Action buttons
  view: { vi: "Xem", en: "View" },
  activate: { vi: "Kích hoạt", en: "Activate" },
  extend: { vi: "Gia hạn", en: "Extend" },
  suspend: { vi: "Tạm ngưng", en: "Suspend" },
  reactivate: { vi: "Kích hoạt lại", en: "Reactivate" },
  cancel: { vi: "Hủy", en: "Cancel" },

  // Filter labels
  filterAll: { vi: "Tất cả", en: "All" },
  searchPlaceholder: {
    vi: "Tìm kiếm tổ chức...",
    en: "Search organizations...",
  },

  // Detail sections
  currentSubscription: { vi: "Đăng ký hiện tại", en: "Current Subscription" },
  subscriptionHistory: { vi: "Lịch sử đăng ký", en: "Subscription History" },
  paymentHistory: { vi: "Lịch sử thanh toán", en: "Payment History" },
  usageStats: { vi: "Thống kê sử dụng", en: "Usage Statistics" },

  // Form labels
  selectPlan: { vi: "Chọn gói", en: "Select Plan" },
  billingCycle: { vi: "Chu kỳ thanh toán", en: "Billing Cycle" },
  amount: { vi: "Số tiền (VND)", en: "Amount (VND)" },
  paymentId: { vi: "Mã thanh toán", en: "Payment ID" },

  // Messages
  loading: { vi: "Đang tải...", en: "Loading..." },
  noOrganizations: {
    vi: "Không tìm thấy tổ chức nào",
    en: "No organizations found",
  },
  confirmSuspend: {
    vi: "Bạn có chắc chắn muốn tạm ngưng tổ chức này?",
    en: "Are you sure you want to suspend this organization?",
  },
  suspendReason: { vi: "Lý do tạm ngưng", en: "Suspension reason" },
  unlimited: { vi: "Không giới hạn", en: "Unlimited" },

  // Dashboard stats
  requiresAttention: {
    vi: "Cần chú ý",
    en: "Requires Attention",
  },
  graceEndsIn: {
    vi: "Gia hạn kết thúc trong",
    en: "Grace period ends in",
  },
  trialEndsIn: {
    vi: "Dùng thử kết thúc trong",
    en: "Trial ends in",
  },
  days: { vi: "ngày", en: "days" },

  // Table date/amount formatting
  date: { vi: "Ngày", en: "Date" },
  action: { vi: "Hành động", en: "Action" },
  amountVnd: { vi: "Số tiền", en: "Amount" },
  admin: { vi: "Quản trị viên", en: "Admin" },
} as const;
