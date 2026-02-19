/**
 * Bilingual labels for the provider-side service execution feature UI.
 *
 * WHY: All UI strings must be centralized here so Vietnamese (primary) and
 * English (secondary) labels stay consistent across pages, forms, and
 * empty states. Mobile-first: labels are short and clear for small screens.
 *
 * Pattern: { vi: "Vietnamese text", en: "English text" }
 */

export const serviceExecutionLabels = {
  page: {
    activeServices: {
      vi: "Dịch vụ đang thực hiện",
      en: "Active Services",
    },
    serviceDetail: {
      vi: "Chi tiết dịch vụ",
      en: "Service Detail",
    },
    completionReport: {
      vi: "Báo cáo hoàn thành",
      en: "Completion Report",
    },
    serviceHistory: {
      vi: "Lịch sử dịch vụ",
      en: "Service History",
    },
  },
  status: {
    accepted: {
      vi: "Đã lên lịch",
      en: "Scheduled",
    },
    in_progress: {
      vi: "Đang thực hiện",
      en: "In Progress",
    },
    completed: {
      vi: "Hoàn thành",
      en: "Completed",
    },
  },
  requestType: {
    repair: { vi: "Sửa chữa", en: "Repair" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
    calibration: { vi: "Hiệu chỉnh", en: "Calibration" },
    inspection: { vi: "Kiểm tra", en: "Inspection" },
    installation: { vi: "Lắp đặt", en: "Installation" },
    other: { vi: "Khác", en: "Other" },
  },
  priority: {
    low: { vi: "Thấp", en: "Low" },
    medium: { vi: "Trung bình", en: "Medium" },
    high: { vi: "Cao", en: "High" },
    critical: { vi: "Khẩn cấp", en: "Critical" },
  },
  actions: {
    startService: { vi: "Bắt đầu dịch vụ", en: "Start Service" },
    updateProgress: { vi: "Cập nhật tiến độ", en: "Update Progress" },
    completeService: { vi: "Hoàn thành dịch vụ", en: "Complete Service" },
    submitReport: { vi: "Gửi báo cáo", en: "Submit Report" },
    viewDetail: { vi: "Xem chi tiết", en: "View Details" },
    back: { vi: "Quay lại", en: "Back" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    cancel: { vi: "Hủy", en: "Cancel" },
  },
  form: {
    workDescription: {
      vi: "Mô tả công việc đã thực hiện",
      en: "Work Description",
    },
    workDescriptionPlaceholder: {
      vi: "Mô tả chi tiết công việc đã thực hiện...",
      en: "Describe in detail the work performed...",
    },
    partsReplaced: {
      vi: "Linh kiện đã thay thế",
      en: "Parts Replaced",
    },
    partsReplacedPlaceholder: {
      vi: "Nhập từng linh kiện, mỗi dòng một cái...",
      en: "Enter each part on a new line...",
    },
    nextMaintenance: {
      vi: "Khuyến nghị bảo trì tiếp theo",
      en: "Next Maintenance Recommendation",
    },
    nextMaintenancePlaceholder: {
      vi: "Ví dụ: Kiểm tra lại sau 6 tháng...",
      en: "E.g. Re-inspect after 6 months...",
    },
    actualHours: {
      vi: "Số giờ thực tế",
      en: "Actual Hours",
    },
    actualHoursPlaceholder: {
      vi: "Nhập số giờ",
      en: "Enter hours",
    },
    progressNotes: {
      vi: "Ghi chú tiến độ",
      en: "Progress Notes",
    },
    progressNotesPlaceholder: {
      vi: "Mô tả tiến độ công việc hiện tại...",
      en: "Describe current work progress...",
    },
    percentComplete: {
      vi: "Tiến độ hoàn thành (%)",
      en: "Completion Progress (%)",
    },
  },
  info: {
    equipment: { vi: "Thiết bị", en: "Equipment" },
    hospital: { vi: "Bệnh viện", en: "Hospital" },
    location: { vi: "Địa điểm", en: "Location" },
    description: { vi: "Mô tả sự cố", en: "Issue Description" },
    priority: { vi: "Mức độ ưu tiên", en: "Priority" },
    type: { vi: "Loại dịch vụ", en: "Service Type" },
    scheduledAt: { vi: "Ngày lên lịch", en: "Scheduled Date" },
    quoteAmount: { vi: "Giá trị hợp đồng", en: "Contract Value" },
  },
  sections: {
    scheduled: {
      vi: "Dịch vụ đã lên lịch",
      en: "Scheduled Services",
    },
    onSite: {
      vi: "Đang thực hiện tại chỗ",
      en: "Currently On-Site",
    },
  },
  emptyState: {
    noActiveServices: {
      vi: "Không có dịch vụ nào đang hoạt động",
      en: "No active services",
    },
    noActiveServicesDescription: {
      vi: "Dịch vụ đã được chấp nhận sẽ xuất hiện ở đây",
      en: "Accepted services will appear here",
    },
  },
  confirmStartService: {
    title: { vi: "Xác nhận bắt đầu dịch vụ", en: "Confirm Start Service" },
    description: {
      vi: "Bạn có chắc chắn muốn bắt đầu thực hiện dịch vụ này? Bệnh viện sẽ được thông báo ngay lập tức.",
      en: "Are you sure you want to start this service? The hospital will be notified immediately.",
    },
  },
  confirmComplete: {
    title: {
      vi: "Xác nhận hoàn thành dịch vụ",
      en: "Confirm Service Completion",
    },
    description: {
      vi: "Bạn có chắc chắn dịch vụ đã hoàn thành? Hãy đảm bảo đã gửi báo cáo hoàn thành.",
      en: "Are you sure the service is complete? Make sure you have submitted the completion report.",
    },
  },
};
