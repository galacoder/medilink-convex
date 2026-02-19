/**
 * Bilingual labels for the providers feature module.
 *
 * WHY: All user-facing text must support Vietnamese (primary) and English
 * (secondary) per CLAUDE.md requirements. Centralizing labels here ensures
 * consistent terminology across all provider UI components.
 *
 * Pattern: follows equipmentLabels in features/equipment/labels.ts exactly.
 */
export const providerLabels = {
  // ---------------------------------------------------------------------------
  // Service Offerings section
  // vi: "Dịch vụ cung cấp" / en: "Service Offerings"
  // ---------------------------------------------------------------------------
  offerings: {
    title: { vi: "Quản lý Dịch vụ", en: "Service Offerings" },
    addOffering: { vi: "Thêm dịch vụ", en: "Add Offering" },
    editOffering: { vi: "Chỉnh sửa dịch vụ", en: "Edit Offering" },
    noOfferings: { vi: "Chưa có dịch vụ nào", en: "No offerings yet" },
    noOfferingsDesc: {
      vi: "Thêm dịch vụ đầu tiên để bắt đầu cung cấp",
      en: "Add your first offering to start providing services",
    },
    specialty: { vi: "Chuyên ngành", en: "Specialty" },
    descriptionVi: {
      vi: "Mô tả (Tiếng Việt)",
      en: "Description (Vietnamese)",
    },
    descriptionEn: {
      vi: "Mô tả (Tiếng Anh)",
      en: "Description (English)",
    },
    priceEstimate: { vi: "Giá ước tính (VND)", en: "Price Estimate (VND)" },
    turnaroundDays: {
      vi: "Thời gian hoàn thành (ngày)",
      en: "Turnaround Days",
    },
    pricePlaceholder: {
      vi: "Để trống nếu giá thương lượng",
      en: "Leave blank if price is negotiable",
    },
    turnaroundPlaceholder: {
      vi: "Số ngày dự kiến hoàn thành",
      en: "Expected completion days",
    },
    createSuccess: {
      vi: "Tạo dịch vụ thành công",
      en: "Offering created successfully",
    },
    updateSuccess: {
      vi: "Cập nhật dịch vụ thành công",
      en: "Offering updated successfully",
    },
    deleteSuccess: {
      vi: "Xóa dịch vụ thành công",
      en: "Offering deleted successfully",
    },
    deleteConfirm: {
      vi: "Bạn có chắc muốn xóa dịch vụ này không?",
      en: "Are you sure you want to delete this offering?",
    },
  },

  // ---------------------------------------------------------------------------
  // Certifications section
  // vi: "Chứng nhận" / en: "Certifications"
  // ---------------------------------------------------------------------------
  certifications: {
    title: { vi: "Chứng chỉ", en: "Certifications" },
    addCertification: { vi: "Thêm chứng nhận", en: "Add Certification" },
    noCertifications: {
      vi: "Chưa có chứng nhận nào",
      en: "No certifications yet",
    },
    noCertificationsDesc: {
      vi: "Thêm chứng nhận để tăng uy tín với bệnh viện",
      en: "Add certifications to build trust with hospitals",
    },
    nameVi: {
      vi: "Tên chứng nhận (Tiếng Việt)",
      en: "Certification Name (Vietnamese)",
    },
    nameEn: {
      vi: "Tên chứng nhận (Tiếng Anh)",
      en: "Certification Name (English)",
    },
    issuingBody: { vi: "Cơ quan cấp", en: "Issuing Body" },
    issuedDate: { vi: "Ngày cấp", en: "Issue Date" },
    expiryDate: { vi: "Ngày hết hạn", en: "Expiry Date" },
    document: { vi: "Tài liệu", en: "Document" },
    viewDocument: { vi: "Xem tài liệu", en: "View Document" },
    expiryWarning: {
      vi: "Sắp hết hạn",
      en: "Expiring soon",
    },
    expired: { vi: "Đã hết hạn", en: "Expired" },
    createSuccess: {
      vi: "Thêm chứng nhận thành công",
      en: "Certification added successfully",
    },
  },

  // ---------------------------------------------------------------------------
  // Coverage areas section
  // vi: "Khu vực phủ sóng" / en: "Coverage Areas"
  // ---------------------------------------------------------------------------
  coverage: {
    title: { vi: "Khu vực phục vụ", en: "Coverage Areas" },
    addRegion: { vi: "Thêm khu vực", en: "Add Region" },
    removeRegion: { vi: "Xóa khu vực", en: "Remove Region" },
    region: { vi: "Tỉnh/Thành phố", en: "Province/City" },
    district: { vi: "Quận/Huyện (tùy chọn)", en: "District (optional)" },
    regionPlaceholder: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" },
    districtPlaceholder: { vi: "Quận 1", en: "District 1" },
    noCoverage: {
      vi: "Chưa có khu vực phủ sóng",
      en: "No coverage areas defined",
    },
    saveSuccess: {
      vi: "Cập nhật khu vực phủ sóng thành công",
      en: "Coverage areas updated successfully",
    },
  },

  // ---------------------------------------------------------------------------
  // Provider profile section
  // vi: "Hồ sơ nhà cung cấp" / en: "Provider Profile"
  // ---------------------------------------------------------------------------
  profile: {
    title: { vi: "Hồ sơ nhà cung cấp", en: "Provider Profile" },
    companyName: { vi: "Tên công ty", en: "Company Name" },
    descriptionVi: {
      vi: "Giới thiệu (Tiếng Việt)",
      en: "Description (Vietnamese)",
    },
    descriptionEn: {
      vi: "Giới thiệu (Tiếng Anh)",
      en: "Description (English)",
    },
    contactEmail: { vi: "Email liên hệ", en: "Contact Email" },
    contactPhone: { vi: "Số điện thoại", en: "Phone Number" },
    address: { vi: "Địa chỉ", en: "Address" },
    updateSuccess: {
      vi: "Cập nhật hồ sơ thành công",
      en: "Profile updated successfully",
    },
    companyNamePlaceholder: {
      vi: "Tên công ty đầy đủ",
      en: "Full company name",
    },
    emailPlaceholder: { vi: "contact@company.vn", en: "contact@company.com" },
    phonePlaceholder: { vi: "+84-28-1234-5678", en: "+84-28-1234-5678" },
    addressPlaceholder: {
      vi: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      en: "123 Nguyen Hue, District 1, HCMC",
    },
  },

  // ---------------------------------------------------------------------------
  // Common actions
  // vi: "Hành động" / en: "Actions"
  // ---------------------------------------------------------------------------
  actions: {
    save: { vi: "Lưu", en: "Save" },
    cancel: { vi: "Hủy", en: "Cancel" },
    edit: { vi: "Chỉnh sửa", en: "Edit" },
    delete: { vi: "Xóa", en: "Delete" },
    create: { vi: "Tạo mới", en: "Create" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    back: { vi: "Quay lại", en: "Back" },
    viewAll: { vi: "Xem tất cả", en: "View All" },
    loading: { vi: "Đang tải...", en: "Loading..." },
    saving: { vi: "Đang lưu...", en: "Saving..." },
  },

  // ---------------------------------------------------------------------------
  // Status values
  // vi: "Trạng thái" / en: "Status"
  // ---------------------------------------------------------------------------
  status: {
    verificationStatus: {
      pending: { vi: "Chờ xác minh", en: "Pending Verification" },
      in_review: { vi: "Đang xem xét", en: "Under Review" },
      verified: { vi: "Đã xác minh", en: "Verified" },
      rejected: { vi: "Bị từ chối", en: "Rejected" },
    },
    specialtyValues: {
      general_repair: { vi: "Sửa chữa tổng quát", en: "General Repair" },
      calibration: { vi: "Hiệu chỉnh", en: "Calibration" },
      installation: { vi: "Lắp đặt", en: "Installation" },
      preventive_maint: {
        vi: "Bảo trì phòng ngừa",
        en: "Preventive Maintenance",
      },
      electrical: { vi: "Điện", en: "Electrical" },
      software: { vi: "Phần mềm", en: "Software" },
      diagnostics: { vi: "Chẩn đoán", en: "Diagnostics" },
      training: { vi: "Đào tạo", en: "Training" },
      other: { vi: "Khác", en: "Other" },
    },
  },

  // ---------------------------------------------------------------------------
  // Error messages
  // vi: "Lỗi" / en: "Errors"
  // ---------------------------------------------------------------------------
  errors: {
    generic: { vi: "Có lỗi xảy ra", en: "An error occurred" },
    notFound: {
      vi: "Không tìm thấy nhà cung cấp",
      en: "Provider not found",
    },
    unauthorized: {
      vi: "Bạn không có quyền thực hiện thao tác này",
      en: "You are not authorized for this action",
    },
  },
} as const;
