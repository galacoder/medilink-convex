export const equipmentLabels = {
  title: { vi: "Thiết bị y tế", en: "Medical Equipment" },
  addEquipment: { vi: "Thêm thiết bị", en: "Add Equipment" },
  editEquipment: { vi: "Chỉnh sửa thiết bị", en: "Edit Equipment" },
  equipmentDetail: { vi: "Chi tiết thiết bị", en: "Equipment Detail" },
  noEquipment: { vi: "Chưa có thiết bị nào", en: "No equipment yet" },
  noEquipmentDesc: {
    vi: "Thêm thiết bị đầu tiên để bắt đầu theo dõi",
    en: "Add your first equipment to start tracking",
  },

  // Fields
  name: { vi: "Tên thiết bị", en: "Equipment Name" },
  nameVi: { vi: "Tên (Tiếng Việt)", en: "Name (Vietnamese)" },
  nameEn: { vi: "Tên (Tiếng Anh)", en: "Name (English)" },
  serialNumber: { vi: "Số serial", en: "Serial Number" },
  model: { vi: "Model", en: "Model" },
  manufacturer: { vi: "Nhà sản xuất", en: "Manufacturer" },
  category: { vi: "Danh mục", en: "Category" },
  location: { vi: "Vị trí", en: "Location" },
  condition: { vi: "Tình trạng", en: "Condition" },
  criticality: { vi: "Mức độ quan trọng", en: "Criticality" },
  purchaseDate: { vi: "Ngày mua", en: "Purchase Date" },
  warrantyExpiry: { vi: "Hết hạn bảo hành", en: "Warranty Expiry" },
  notes: { vi: "Ghi chú", en: "Notes" },
  description: { vi: "Mô tả", en: "Description" },
  descriptionVi: { vi: "Mô tả (Tiếng Việt)", en: "Description (Vietnamese)" },
  descriptionEn: { vi: "Mô tả (Tiếng Anh)", en: "Description (English)" },

  // Status
  status: { vi: "Trạng thái", en: "Status" },
  statusValues: {
    available: { vi: "Sẵn sàng", en: "Available" },
    in_use: { vi: "Đang sử dụng", en: "In Use" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
    damaged: { vi: "Hỏng", en: "Damaged" },
    retired: { vi: "Đã nghỉ hưu", en: "Retired" },
  },

  // Condition
  conditionValues: {
    excellent: { vi: "Xuất sắc", en: "Excellent" },
    good: { vi: "Tốt", en: "Good" },
    fair: { vi: "Trung bình", en: "Fair" },
    poor: { vi: "Kém", en: "Poor" },
  },

  // Criticality
  criticalityValues: {
    A: { vi: "Quan trọng cao", en: "High" },
    B: { vi: "Quan trọng vừa", en: "Medium" },
    C: { vi: "Quan trọng thấp", en: "Low" },
  },

  // Actions
  updateStatus: { vi: "Cập nhật trạng thái", en: "Update Status" },
  viewDetail: { vi: "Xem chi tiết", en: "View Detail" },
  edit: { vi: "Chỉnh sửa", en: "Edit" },
  save: { vi: "Lưu", en: "Save" },
  cancel: { vi: "Hủy", en: "Cancel" },
  create: { vi: "Tạo mới", en: "Create" },
  delete: { vi: "Xóa", en: "Delete" },
  confirm: { vi: "Xác nhận", en: "Confirm" },

  // History
  history: { vi: "Lịch sử", en: "History" },
  historyEmpty: { vi: "Chưa có lịch sử", en: "No history yet" },
  actionTypes: {
    created: { vi: "Tạo mới", en: "Created" },
    updated: { vi: "Cập nhật", en: "Updated" },
    status_changed: { vi: "Thay đổi trạng thái", en: "Status Changed" },
    maintenance_scheduled: { vi: "Lên lịch bảo trì", en: "Maintenance Scheduled" },
    failure_reported: { vi: "Báo cáo sự cố", en: "Failure Reported" },
  },

  // Filters
  filterByStatus: { vi: "Lọc theo trạng thái", en: "Filter by Status" },
  filterByCategory: { vi: "Lọc theo danh mục", en: "Filter by Category" },
  searchPlaceholder: { vi: "Tìm kiếm thiết bị...", en: "Search equipment..." },
  allStatuses: { vi: "Tất cả trạng thái", en: "All Statuses" },
  allCategories: { vi: "Tất cả danh mục", en: "All Categories" },
  search: { vi: "Tìm kiếm", en: "Search" },

  // QR
  qrCode: { vi: "Mã QR", en: "QR Code" },
  scanQR: { vi: "Quét mã QR", en: "Scan QR Code" },
  equipmentQR: { vi: "Mã QR Thiết bị", en: "Equipment QR Code" },
  printQR: { vi: "In mã QR", en: "Print QR Code" },

  // Bulk actions
  selectAll: { vi: "Chọn tất cả", en: "Select All" },
  bulkUpdateStatus: { vi: "Cập nhật trạng thái hàng loạt", en: "Bulk Update Status" },
  selectedItems: { vi: "mục đã chọn", en: "items selected" },
  clearSelection: { vi: "Bỏ chọn", en: "Clear Selection" },

  // Loading
  loading: { vi: "Đang tải...", en: "Loading..." },
  loadMore: { vi: "Tải thêm", en: "Load More" },

  // Status update dialog
  updateStatusTitle: { vi: "Cập nhật trạng thái thiết bị", en: "Update Equipment Status" },
  newStatus: { vi: "Trạng thái mới", en: "New Status" },
  updateNotes: { vi: "Ghi chú cập nhật", en: "Update Notes" },
  updateNotesPlaceholder: { vi: "Ghi chú về lý do thay đổi trạng thái...", en: "Notes about the status change reason..." },

  // Breadcrumbs
  backToList: { vi: "Quay lại danh sách", en: "Back to List" },
  newEquipment: { vi: "Thêm thiết bị mới", en: "New Equipment" },

  // Sections
  generalInfo: { vi: "Thông tin chung", en: "General Information" },
  technicalInfo: { vi: "Thông tin kỹ thuật", en: "Technical Details" },
  dateInfo: { vi: "Thông tin ngày tháng", en: "Date Information" },
  maintenanceInfo: { vi: "Lịch bảo trì", en: "Maintenance Schedule" },
  noMaintenanceScheduled: { vi: "Chưa có lịch bảo trì", en: "No maintenance scheduled" },

  // Success/Error messages
  createSuccess: { vi: "Tạo thiết bị thành công", en: "Equipment created successfully" },
  updateSuccess: { vi: "Cập nhật thiết bị thành công", en: "Equipment updated successfully" },
  statusUpdateSuccess: { vi: "Cập nhật trạng thái thành công", en: "Status updated successfully" },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },
} as const;
