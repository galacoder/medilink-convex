/**
 * Bilingual labels for the admin-providers feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ cho quản lý nhà cung cấp (quản trị viên)"
 * en: "Admin provider management bilingual labels"
 */
export const adminProviderLabels = {
  // Page titles
  title: { vi: "Quản lý nhà cung cấp", en: "Provider Management" },
  subtitle: {
    vi: "Xem xét và phê duyệt đăng ký nhà cung cấp",
    en: "Review and approve provider registrations",
  },
  detailTitle: { vi: "Chi tiết nhà cung cấp", en: "Provider Detail" },

  // Status labels
  statuses: {
    active: { vi: "Hoạt động", en: "Active" },
    inactive: { vi: "Không hoạt động", en: "Inactive" },
    suspended: { vi: "Bị đình chỉ", en: "Suspended" },
    pending_verification: { vi: "Chờ xác minh", en: "Pending Verification" },
  },

  // Verification status labels
  verificationStatuses: {
    pending: { vi: "Đang chờ", en: "Pending" },
    in_review: { vi: "Đang xem xét", en: "In Review" },
    verified: { vi: "Đã xác minh", en: "Verified" },
    rejected: { vi: "Bị từ chối", en: "Rejected" },
  },

  // Field labels
  fields: {
    name: { vi: "Tên nhà cung cấp", en: "Provider Name" },
    companyName: { vi: "Tên công ty", en: "Company Name" },
    status: { vi: "Trạng thái", en: "Status" },
    verificationStatus: {
      vi: "Trạng thái xác minh",
      en: "Verification Status",
    },
    contactEmail: { vi: "Email liên hệ", en: "Contact Email" },
    contactPhone: { vi: "Điện thoại liên hệ", en: "Contact Phone" },
    address: { vi: "Địa chỉ", en: "Address" },
    organization: { vi: "Tổ chức", en: "Organization" },
    createdAt: { vi: "Ngày đăng ký", en: "Registration Date" },
    updatedAt: { vi: "Cập nhật lần cuối", en: "Last Updated" },
    averageRating: { vi: "Đánh giá trung bình", en: "Average Rating" },
    completedServices: {
      vi: "Dịch vụ đã hoàn thành",
      en: "Completed Services",
    },
    disputeCount: { vi: "Số tranh chấp", en: "Dispute Count" },
    completionRate: { vi: "Tỉ lệ hoàn thành", en: "Completion Rate" },
  },

  // Action labels
  actions: {
    approve: { vi: "Phê duyệt", en: "Approve" },
    reject: { vi: "Từ chối", en: "Reject" },
    suspend: { vi: "Đình chỉ", en: "Suspend" },
    reactivate: { vi: "Khôi phục", en: "Reactivate" },
    verifyCertification: {
      vi: "Xác minh chứng nhận",
      en: "Verify Certification",
    },
    viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
    backToList: { vi: "Danh sách nhà cung cấp", en: "Provider List" },
  },

  // Section labels
  sections: {
    providerInfo: { vi: "Thông tin nhà cung cấp", en: "Provider Information" },
    serviceOfferings: { vi: "Dịch vụ cung cấp", en: "Service Offerings" },
    certifications: { vi: "Chứng nhận", en: "Certifications" },
    coverageAreas: { vi: "Khu vực phủ sóng", en: "Coverage Areas" },
    performanceMetrics: { vi: "Hiệu suất", en: "Performance Metrics" },
    approvalQueue: { vi: "Hàng chờ phê duyệt", en: "Approval Queue" },
  },

  // Filter tabs
  filterTabs: {
    all: { vi: "Tất cả", en: "All" },
    pending_verification: { vi: "Chờ duyệt", en: "Pending" },
    active: { vi: "Đang hoạt động", en: "Active" },
    suspended: { vi: "Bị đình chỉ", en: "Suspended" },
    rejected: { vi: "Bị từ chối", en: "Rejected" },
  },

  // Dialog labels
  dialogs: {
    approveTitle: { vi: "Phê duyệt nhà cung cấp", en: "Approve Provider" },
    approveDescription: {
      vi: "Bạn có chắc chắn muốn phê duyệt nhà cung cấp này? Họ sẽ được phép hoạt động trên nền tảng.",
      en: "Are you sure you want to approve this provider? They will be allowed to operate on the platform.",
    },
    rejectTitle: { vi: "Từ chối nhà cung cấp", en: "Reject Provider" },
    rejectDescription: {
      vi: "Vui lòng cung cấp lý do từ chối. Thông tin này sẽ được ghi lại trong nhật ký kiểm tra.",
      en: "Please provide a rejection reason. This information will be recorded in the audit log.",
    },
    suspendTitle: { vi: "Đình chỉ nhà cung cấp", en: "Suspend Provider" },
    suspendDescription: {
      vi: "Nhà cung cấp sẽ không thể nhận yêu cầu dịch vụ mới khi bị đình chỉ.",
      en: "The provider will not be able to receive new service requests while suspended.",
    },
    reactivateTitle: {
      vi: "Khôi phục nhà cung cấp",
      en: "Reactivate Provider",
    },
    reactivateDescription: {
      vi: "Nhà cung cấp sẽ có thể hoạt động trở lại trên nền tảng.",
      en: "The provider will be able to operate on the platform again.",
    },
    reasonLabel: { vi: "Lý do", en: "Reason" },
    notesLabel: { vi: "Ghi chú (không bắt buộc)", en: "Notes (optional)" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    cancel: { vi: "Hủy", en: "Cancel" },
  },

  // Empty states
  empty: {
    noProviders: { vi: "Chưa có nhà cung cấp nào", en: "No providers yet" },
    noProvidersDesc: {
      vi: "Các nhà cung cấp đăng ký sẽ xuất hiện ở đây",
      en: "Registered providers will appear here",
    },
    noCertifications: { vi: "Chưa có chứng nhận", en: "No certifications" },
    noServiceOfferings: { vi: "Chưa có dịch vụ", en: "No service offerings" },
    noCoverageAreas: { vi: "Chưa có khu vực", en: "No coverage areas" },
  },

  // Loading state
  loading: { vi: "Đang tải...", en: "Loading..." },

  // Success/Error
  approveSuccess: { vi: "Phê duyệt thành công", en: "Approved successfully" },
  rejectSuccess: { vi: "Từ chối thành công", en: "Rejected successfully" },
  suspendSuccess: { vi: "Đình chỉ thành công", en: "Suspended successfully" },
  reactivateSuccess: {
    vi: "Khôi phục thành công",
    en: "Reactivated successfully",
  },
  verifyCertSuccess: {
    vi: "Xác minh chứng nhận thành công",
    en: "Certification verified successfully",
  },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },

  // Placeholders
  placeholders: {
    search: {
      vi: "Tìm kiếm nhà cung cấp...",
      en: "Search providers...",
    },
    reason: {
      vi: "Nhập lý do...",
      en: "Enter reason...",
    },
    notes: {
      vi: "Thêm ghi chú...",
      en: "Add notes...",
    },
  },
} as const;
