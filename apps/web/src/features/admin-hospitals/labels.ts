/**
 * Bilingual labels for the admin-hospitals feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ quản lý bệnh viện" / en: "Hospital management bilingual labels"
 */
export const adminHospitalLabels = {
  // Page titles
  title: { vi: "Quản lý bệnh viện", en: "Hospital Management" },
  subtitle: {
    vi: "Quản lý tất cả tổ chức bệnh viện trên nền tảng",
    en: "Manage all hospital organizations on the platform",
  },
  detailTitle: { vi: "Chi tiết bệnh viện", en: "Hospital Detail" },
  usageTitle: { vi: "Thống kê sử dụng", en: "Usage Metrics" },

  // Status labels
  statuses: {
    active: { vi: "Đang hoạt động", en: "Active" },
    suspended: { vi: "Đã đình chỉ", en: "Suspended" },
    trial: { vi: "Đang dùng thử", en: "Trial" },
  },

  // Field labels
  fields: {
    name: { vi: "Tên bệnh viện", en: "Hospital Name" },
    slug: { vi: "Định danh", en: "Slug" },
    status: { vi: "Trạng thái", en: "Status" },
    memberCount: { vi: "Số thành viên", en: "Members" },
    equipmentCount: { vi: "Số thiết bị", en: "Equipment" },
    createdAt: { vi: "Ngày tạo", en: "Created" },
    ownerEmail: { vi: "Email chủ sở hữu", en: "Owner Email" },
    ownerName: { vi: "Tên chủ sở hữu", en: "Owner Name" },
    reason: { vi: "Lý do", en: "Reason" },
    notes: { vi: "Ghi chú", en: "Notes" },
  },

  // Section titles
  sections: {
    members: { vi: "Danh sách thành viên", en: "Members" },
    equipment: { vi: "Tóm tắt thiết bị", en: "Equipment Summary" },
    serviceRequests: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
    usage: { vi: "Thống kê sử dụng", en: "Usage Metrics" },
  },

  // Action labels
  actions: {
    onboard: { vi: "Thêm bệnh viện mới", en: "Onboard Hospital" },
    suspend: { vi: "Đình chỉ", en: "Suspend" },
    reactivate: { vi: "Kích hoạt lại", en: "Reactivate" },
    viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
    search: { vi: "Tìm kiếm", en: "Search" },
    filter: { vi: "Lọc", en: "Filter" },
    submit: { vi: "Xác nhận", en: "Confirm" },
    cancel: { vi: "Hủy", en: "Cancel" },
    back: { vi: "Quay lại", en: "Back" },
  },

  // Filter labels
  filters: {
    allStatuses: { vi: "Tất cả trạng thái", en: "All Statuses" },
    searchPlaceholder: {
      vi: "Tìm kiếm tên bệnh viện...",
      en: "Search hospital name...",
    },
  },

  // Dialog labels
  dialogs: {
    onboard: {
      title: { vi: "Thêm bệnh viện mới", en: "Onboard New Hospital" },
      description: {
        vi: "Tạo tổ chức bệnh viện mới và gửi lời mời đến chủ sở hữu.",
        en: "Create a new hospital organization and send an invite to the owner.",
      },
    },
    suspend: {
      title: { vi: "Đình chỉ bệnh viện", en: "Suspend Hospital" },
      description: {
        vi: "Bệnh viện bị đình chỉ sẽ không thể truy cập hệ thống. Hành động này được ghi vào nhật ký kiểm tra.",
        en: "Suspended hospitals cannot access the system. This action is recorded in the audit log.",
      },
    },
    reactivate: {
      title: { vi: "Kích hoạt lại bệnh viện", en: "Reactivate Hospital" },
      description: {
        vi: "Kích hoạt lại bệnh viện để họ có thể truy cập hệ thống bình thường.",
        en: "Reactivate the hospital so they can access the system normally.",
      },
    },
  },

  // Member roles
  roles: {
    owner: { vi: "Chủ sở hữu", en: "Owner" },
    admin: { vi: "Quản trị viên", en: "Admin" },
    member: { vi: "Thành viên", en: "Member" },
  },

  // Equipment statuses (summary)
  equipmentStatuses: {
    available: { vi: "Sẵn sàng", en: "Available" },
    inUse: { vi: "Đang sử dụng", en: "In Use" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
    damaged: { vi: "Hỏng", en: "Damaged" },
    retired: { vi: "Đã nghỉ hưu", en: "Retired" },
  },

  // Empty states
  empty: {
    noHospitals: { vi: "Chưa có bệnh viện nào", en: "No hospitals yet" },
    noHospitalsDesc: {
      vi: "Thêm bệnh viện đầu tiên để bắt đầu quản lý",
      en: "Onboard the first hospital to start managing",
    },
    noMembers: { vi: "Chưa có thành viên nào", en: "No members yet" },
  },

  // Loading / error states
  loading: { vi: "Đang tải...", en: "Loading..." },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },

  // Success messages
  onboardSuccess: {
    vi: "Thêm bệnh viện thành công",
    en: "Hospital onboarded successfully",
  },
  suspendSuccess: {
    vi: "Đình chỉ bệnh viện thành công",
    en: "Hospital suspended successfully",
  },
  reactivateSuccess: {
    vi: "Kích hoạt lại bệnh viện thành công",
    en: "Hospital reactivated successfully",
  },

  // Breadcrumb
  breadcrumb: {
    hospitals: { vi: "Bệnh viện", en: "Hospitals" },
  },
} as const;
