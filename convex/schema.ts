import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MediLink Convex base schema.
 *
 * Conventions (see CLAUDE.md):
 *  - Timestamps: v.number() (epoch ms)
 *  - Enums:      v.union(v.literal("a"), v.literal("b"))
 *  - Indexes:    by_<field> prefix
 *  - All tables: createdAt + updatedAt as v.number()
 *
 * Domain table count: 23 tables across 8 domains
 *   Base: organizations, organizationMemberships, users (3)
 *   Equipment: equipmentCategories, equipment, equipmentHistory,
 *              maintenanceRecords, failureReports (5)
 *   QR Code: qrCodes, qrScanLog (2)
 *   Providers: providers, serviceOfferings, certifications, coverageAreas (4)
 *   Service Requests: serviceRequests, quotes, serviceRatings (3)
 *   Consumables: consumables, consumableUsageLog, reorderRequests (3)
 *   Disputes: disputes, disputeMessages (2)
 *   Audit Log: auditLog (1)
 */
export default defineSchema({
  // ===========================================================================
  // BASE DOMAIN (3 tables)
  // ===========================================================================

  /**
   * Organizations represent SPMET Healthcare School or any provider group.
   * org_type distinguishes between hospital facilities and equipment providers.
   */
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    // Bilingual label: vi: "Loại tổ chức" / en: "Organization type"
    org_type: v.union(v.literal("hospital"), v.literal("provider")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["org_type"])
    .index("by_slug", ["slug"]),

  /**
   * Links users to organizations with a specific role.
   * Supports multi-tenancy for future multi-school expansion.
   */
  organizationMemberships: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    // Bilingual label: vi: "Vai trò" / en: "Role"
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["orgId", "userId"]),

  /**
   * Platform-level users (students, staff, admins).
   * Organization-scoped roles are in organizationMemberships.
   * platformRole is reserved for super-admins who manage the platform itself.
   */
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // Bilingual label: vi: "Vai trò nền tảng" / en: "Platform role"
    // Optional: only set for platform_admin or platform_support users
    platformRole: v.optional(
      v.union(v.literal("platform_admin"), v.literal("platform_support")),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ===========================================================================
  // EQUIPMENT DOMAIN (5 tables)
  // vi: "Lĩnh vực thiết bị" / en: "Equipment domain"
  // ===========================================================================

  /**
   * Equipment categories for organizing medical devices.
   * vi: "Danh mục thiết bị" / en: "Equipment categories"
   */
  equipmentCategories: defineTable({
    // vi: "Tên danh mục (tiếng Việt)" / en: "Category name (Vietnamese)"
    nameVi: v.string(),
    // vi: "Tên danh mục (tiếng Anh)" / en: "Category name (English)"
    nameEn: v.string(),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  /**
   * Medical equipment inventory.
   * vi: "Thiết bị y tế" / en: "Medical equipment"
   *
   * Status enum:
   *   available   - vi: "Sẵn sàng"     / en: "Available"
   *   in_use      - vi: "Đang sử dụng" / en: "In use"
   *   maintenance - vi: "Bảo trì"      / en: "Under maintenance"
   *   damaged     - vi: "Hỏng"         / en: "Damaged"
   *   retired     - vi: "Đã nghỉ hưu"  / en: "Retired"
   *
   * Condition enum:
   *   excellent - vi: "Xuất sắc" / en: "Excellent"
   *   good      - vi: "Tốt"      / en: "Good"
   *   fair      - vi: "Trung bình" / en: "Fair"
   *   poor      - vi: "Kém"      / en: "Poor"
   *
   * Criticality enum:
   *   A - vi: "Quan trọng cao" / en: "High criticality"
   *   B - vi: "Quan trọng vừa" / en: "Medium criticality"
   *   C - vi: "Quan trọng thấp" / en: "Low criticality"
   */
  equipment: defineTable({
    nameVi: v.string(),
    nameEn: v.string(),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    categoryId: v.id("equipmentCategories"),
    organizationId: v.id("organizations"),
    // vi: "Trạng thái" / en: "Status"
    status: v.union(
      v.literal("available"),
      v.literal("in_use"),
      v.literal("maintenance"),
      v.literal("damaged"),
      v.literal("retired"),
    ),
    // vi: "Tình trạng" / en: "Condition"
    condition: v.union(
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor"),
    ),
    // vi: "Mức độ quan trọng" / en: "Criticality"
    criticality: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    serialNumber: v.optional(v.string()),
    model: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    // vi: "Ngày mua" / en: "Purchase date" (epoch ms)
    purchaseDate: v.optional(v.number()),
    // vi: "Ngày hết bảo hành" / en: "Warranty expiry date" (epoch ms)
    warrantyExpiryDate: v.optional(v.number()),
    location: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_category", ["categoryId"])
    .index("by_org_and_serialNumber", ["organizationId", "serialNumber"]),

  /**
   * Audit trail for equipment status transitions.
   * vi: "Lịch sử thiết bị" / en: "Equipment history"
   *
   * actionType enum:
   *   status_change - vi: "Thay đổi trạng thái" / en: "Status change"
   *   maintenance   - vi: "Bảo trì"             / en: "Maintenance"
   *   repair        - vi: "Sửa chữa"            / en: "Repair"
   *   inspection    - vi: "Kiểm tra"             / en: "Inspection"
   */
  equipmentHistory: defineTable({
    equipmentId: v.id("equipment"),
    // vi: "Loại hành động" / en: "Action type"
    actionType: v.union(
      v.literal("status_change"),
      v.literal("maintenance"),
      v.literal("repair"),
      v.literal("inspection"),
    ),
    previousStatus: v.optional(v.string()),
    newStatus: v.optional(v.string()),
    notes: v.optional(v.string()),
    performedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_equipment", ["equipmentId"])
    .index("by_performed_by", ["performedBy"]),

  /**
   * Preventive and corrective maintenance scheduling.
   * vi: "Hồ sơ bảo trì" / en: "Maintenance records"
   *
   * type enum:
   *   preventive  - vi: "Phòng ngừa"  / en: "Preventive"
   *   corrective  - vi: "Sửa chữa"    / en: "Corrective"
   *   inspection  - vi: "Kiểm tra"    / en: "Inspection"
   *   calibration - vi: "Hiệu chỉnh"  / en: "Calibration"
   *
   * status enum:
   *   scheduled   - vi: "Đã lên lịch" / en: "Scheduled"
   *   in_progress - vi: "Đang thực hiện" / en: "In progress"
   *   completed   - vi: "Hoàn thành"  / en: "Completed"
   *   overdue     - vi: "Quá hạn"     / en: "Overdue"
   *   cancelled   - vi: "Đã hủy"      / en: "Cancelled"
   *
   * recurringPattern enum:
   *   none     - vi: "Không lặp"   / en: "No recurrence"
   *   daily    - vi: "Hàng ngày"   / en: "Daily"
   *   weekly   - vi: "Hàng tuần"   / en: "Weekly"
   *   monthly  - vi: "Hàng tháng"  / en: "Monthly"
   *   quarterly - vi: "Hàng quý"  / en: "Quarterly"
   *   annually  - vi: "Hàng năm"   / en: "Annually"
   */
  maintenanceRecords: defineTable({
    equipmentId: v.id("equipment"),
    // vi: "Loại bảo trì" / en: "Maintenance type"
    type: v.union(
      v.literal("preventive"),
      v.literal("corrective"),
      v.literal("inspection"),
      v.literal("calibration"),
    ),
    // vi: "Trạng thái bảo trì" / en: "Maintenance status"
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue"),
      v.literal("cancelled"),
    ),
    // vi: "Mẫu lặp lại" / en: "Recurring pattern"
    recurringPattern: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annually"),
    ),
    // vi: "Ngày lên lịch" / en: "Scheduled date" (epoch ms)
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
    technicianId: v.optional(v.id("users")),
    technicianNotes: v.optional(v.string()),
    cost: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_equipment", ["equipmentId"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"]),

  /**
   * Equipment failure/damage reports.
   * vi: "Báo cáo sự cố" / en: "Failure reports"
   *
   * urgency enum:
   *   low      - vi: "Thấp"   / en: "Low"
   *   medium   - vi: "Trung bình" / en: "Medium"
   *   high     - vi: "Cao"    / en: "High"
   *   critical - vi: "Khẩn cấp" / en: "Critical"
   *
   * status enum:
   *   open        - vi: "Mở"           / en: "Open"
   *   in_progress - vi: "Đang xử lý"   / en: "In progress"
   *   resolved    - vi: "Đã giải quyết" / en: "Resolved"
   *   closed      - vi: "Đã đóng"      / en: "Closed"
   *   cancelled   - vi: "Đã hủy"       / en: "Cancelled"
   */
  failureReports: defineTable({
    equipmentId: v.id("equipment"),
    // vi: "Mức độ khẩn cấp" / en: "Urgency level"
    urgency: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    // vi: "Trạng thái" / en: "Status"
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("cancelled"),
    ),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    reportedBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_equipment", ["equipmentId"])
    .index("by_status", ["status"])
    .index("by_urgency", ["urgency"]),

  // ===========================================================================
  // QR CODE DOMAIN (2 tables)
  // vi: "Lĩnh vực mã QR" / en: "QR code domain"
  // ===========================================================================

  /**
   * QR codes linked to equipment for mobile scan workflows.
   * vi: "Mã QR" / en: "QR codes"
   */
  qrCodes: defineTable({
    equipmentId: v.id("equipment"),
    organizationId: v.id("organizations"),
    // vi: "Giá trị mã QR duy nhất" / en: "Unique QR code value"
    code: v.string(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_equipment", ["equipmentId"])
    .index("by_org", ["organizationId"])
    .index("by_code", ["code"]),

  /**
   * Tracks every QR code scan event.
   * vi: "Nhật ký quét mã QR" / en: "QR scan log"
   *
   * action enum:
   *   view         - vi: "Xem"             / en: "View"
   *   borrow       - vi: "Mượn"            / en: "Borrow"
   *   return       - vi: "Trả"             / en: "Return"
   *   report_issue - vi: "Báo sự cố"       / en: "Report issue"
   */
  qrScanLog: defineTable({
    qrCodeId: v.id("qrCodes"),
    scannedBy: v.id("users"),
    // vi: "Hành động" / en: "Action"
    action: v.union(
      v.literal("view"),
      v.literal("borrow"),
      v.literal("return"),
      v.literal("report_issue"),
    ),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_qr_code", ["qrCodeId"])
    .index("by_scanned_by", ["scannedBy"]),

  // ===========================================================================
  // PROVIDERS DOMAIN (4 tables)
  // vi: "Lĩnh vực nhà cung cấp" / en: "Providers domain"
  // ===========================================================================

  /**
   * External service providers (repair companies, maintenance technicians).
   * vi: "Nhà cung cấp dịch vụ" / en: "Service providers"
   *
   * status enum:
   *   active               - vi: "Hoạt động"         / en: "Active"
   *   inactive             - vi: "Không hoạt động"    / en: "Inactive"
   *   suspended            - vi: "Bị đình chỉ"        / en: "Suspended"
   *   pending_verification - vi: "Chờ xác minh"       / en: "Pending verification"
   *
   * verificationStatus enum:
   *   pending   - vi: "Đang chờ"    / en: "Pending"
   *   in_review - vi: "Đang xem xét" / en: "In review"
   *   verified  - vi: "Đã xác minh" / en: "Verified"
   *   rejected  - vi: "Bị từ chối"  / en: "Rejected"
   */
  providers: defineTable({
    organizationId: v.id("organizations"),
    nameVi: v.string(),
    nameEn: v.string(),
    companyName: v.optional(v.string()),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    // vi: "Trạng thái nhà cung cấp" / en: "Provider status"
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
      v.literal("pending_verification"),
    ),
    // vi: "Trạng thái xác minh" / en: "Verification status"
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    // vi: "Đánh giá trung bình" / en: "Average rating" (1.0-5.0)
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    completedServices: v.optional(v.number()),
    // Link to a user account if the provider has a platform login
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_verification_status", ["verificationStatus"]),

  /**
   * Services offered by a provider.
   * vi: "Dịch vụ cung cấp" / en: "Service offerings"
   *
   * specialty enum (9 values):
   *   general_repair   - vi: "Sửa chữa chung"      / en: "General repair"
   *   calibration      - vi: "Hiệu chỉnh"           / en: "Calibration"
   *   installation     - vi: "Lắp đặt"              / en: "Installation"
   *   preventive_maint - vi: "Bảo trì phòng ngừa"   / en: "Preventive maintenance"
   *   electrical       - vi: "Điện"                  / en: "Electrical"
   *   software         - vi: "Phần mềm"              / en: "Software"
   *   diagnostics      - vi: "Chẩn đoán"             / en: "Diagnostics"
   *   training         - vi: "Đào tạo"               / en: "Training"
   *   other            - vi: "Khác"                  / en: "Other"
   */
  serviceOfferings: defineTable({
    providerId: v.id("providers"),
    // vi: "Chuyên môn" / en: "Specialty"
    specialty: v.union(
      v.literal("general_repair"),
      v.literal("calibration"),
      v.literal("installation"),
      v.literal("preventive_maint"),
      v.literal("electrical"),
      v.literal("software"),
      v.literal("diagnostics"),
      v.literal("training"),
      v.literal("other"),
    ),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    turnaroundDays: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_provider", ["providerId"]),

  /**
   * Provider certifications and licenses.
   * vi: "Chứng nhận nhà cung cấp" / en: "Provider certifications"
   */
  certifications: defineTable({
    providerId: v.id("providers"),
    nameVi: v.string(),
    nameEn: v.string(),
    issuingBody: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    documentUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_provider", ["providerId"]),

  /**
   * Geographic coverage areas for providers.
   * vi: "Khu vực phủ sóng" / en: "Coverage areas"
   */
  coverageAreas: defineTable({
    providerId: v.id("providers"),
    // vi: "Tỉnh/Thành phố" / en: "Province/City"
    region: v.string(),
    district: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_provider", ["providerId"]),

  // ===========================================================================
  // SERVICE REQUESTS DOMAIN (3 tables)
  // vi: "Lĩnh vực yêu cầu dịch vụ" / en: "Service requests domain"
  // ===========================================================================

  /**
   * Equipment service requests submitted by hospital staff.
   * vi: "Yêu cầu dịch vụ" / en: "Service requests"
   *
   * type enum:
   *   repair      - vi: "Sửa chữa"  / en: "Repair"
   *   maintenance - vi: "Bảo trì"   / en: "Maintenance"
   *   calibration - vi: "Hiệu chỉnh" / en: "Calibration"
   *   inspection  - vi: "Kiểm tra"  / en: "Inspection"
   *   installation - vi: "Lắp đặt" / en: "Installation"
   *   other       - vi: "Khác"      / en: "Other"
   *
   * status enum:
   *   pending     - vi: "Đang chờ"        / en: "Pending"
   *   quoted      - vi: "Đã báo giá"      / en: "Quoted"
   *   accepted    - vi: "Đã chấp nhận"    / en: "Accepted"
   *   in_progress - vi: "Đang thực hiện"  / en: "In progress"
   *   completed   - vi: "Hoàn thành"      / en: "Completed"
   *   cancelled   - vi: "Đã hủy"          / en: "Cancelled"
   *   disputed    - vi: "Đang tranh chấp" / en: "Disputed"
   *
   * priority enum:
   *   low      - vi: "Thấp"      / en: "Low"
   *   medium   - vi: "Trung bình" / en: "Medium"
   *   high     - vi: "Cao"       / en: "High"
   *   critical - vi: "Khẩn cấp"  / en: "Critical"
   */
  serviceRequests: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    requestedBy: v.id("users"),
    assignedProviderId: v.optional(v.id("providers")),
    // vi: "Loại yêu cầu" / en: "Request type"
    type: v.union(
      v.literal("repair"),
      v.literal("maintenance"),
      v.literal("calibration"),
      v.literal("inspection"),
      v.literal("installation"),
      v.literal("other"),
    ),
    // vi: "Trạng thái yêu cầu" / en: "Request status"
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("disputed"),
    ),
    // vi: "Mức ưu tiên" / en: "Priority"
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_equipment", ["equipmentId"])
    .index("by_provider", ["assignedProviderId"]),

  /**
   * Price quotes submitted by providers for service requests.
   * vi: "Báo giá" / en: "Quotes"
   *
   * status enum:
   *   pending  - vi: "Đang chờ"       / en: "Pending"
   *   accepted - vi: "Đã chấp nhận"   / en: "Accepted"
   *   rejected - vi: "Đã từ chối"     / en: "Rejected"
   *   expired  - vi: "Đã hết hạn"     / en: "Expired"
   */
  quotes: defineTable({
    serviceRequestId: v.id("serviceRequests"),
    providerId: v.id("providers"),
    // vi: "Trạng thái báo giá" / en: "Quote status"
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    amount: v.number(),
    // vi: "Đơn vị tiền tệ" / en: "Currency" (e.g., "VND", "USD")
    currency: v.string(),
    validUntil: v.optional(v.number()),
    notes: v.optional(v.string()),
    // vi: "Số ngày ước tính để hoàn thành" / en: "Estimated days to complete"
    estimatedDurationDays: v.optional(v.number()),
    // vi: "Ngày bắt đầu sớm nhất có thể" / en: "Earliest available start date (epoch ms)"
    availableStartDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_service_request", ["serviceRequestId"])
    .index("by_provider", ["providerId"]),

  /**
   * Service quality ratings after request completion.
   * vi: "Đánh giá dịch vụ" / en: "Service ratings"
   */
  serviceRatings: defineTable({
    serviceRequestId: v.id("serviceRequests"),
    providerId: v.id("providers"),
    ratedBy: v.id("users"),
    // vi: "Đánh giá (1-5 sao)" / en: "Rating (1-5 stars)"
    rating: v.number(),
    commentVi: v.optional(v.string()),
    commentEn: v.optional(v.string()),
    // vi: "Chất lượng dịch vụ (1-5)" / en: "Service quality (1-5)"
    serviceQuality: v.optional(v.number()),
    // vi: "Đúng giờ (1-5)" / en: "Timeliness (1-5)"
    timeliness: v.optional(v.number()),
    // vi: "Chuyên nghiệp (1-5)" / en: "Professionalism (1-5)"
    professionalism: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_service_request", ["serviceRequestId"])
    .index("by_provider", ["providerId"]),

  // ===========================================================================
  // CONSUMABLES DOMAIN (3 tables)
  // vi: "Lĩnh vực vật tư tiêu hao" / en: "Consumables domain"
  // ===========================================================================

  /**
   * Consumable supplies inventory (gloves, syringes, electrodes, etc.).
   * vi: "Vật tư tiêu hao" / en: "Consumables"
   *
   * categoryType enum (7 values):
   *   disposables     - vi: "Dùng một lần"   / en: "Disposables"
   *   reagents        - vi: "Hóa chất"        / en: "Reagents"
   *   electrodes      - vi: "Điện cực"        / en: "Electrodes"
   *   filters         - vi: "Bộ lọc"          / en: "Filters"
   *   lubricants      - vi: "Chất bôi trơn"   / en: "Lubricants"
   *   cleaning_agents - vi: "Chất tẩy rửa"    / en: "Cleaning agents"
   *   other           - vi: "Khác"            / en: "Other"
   */
  consumables: defineTable({
    organizationId: v.id("organizations"),
    nameVi: v.string(),
    nameEn: v.string(),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    // vi: "Mã SKU" / en: "SKU code"
    sku: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    // vi: "Đơn vị tính" / en: "Unit of measure"
    unitOfMeasure: v.string(),
    // vi: "Loại vật tư" / en: "Category type"
    categoryType: v.union(
      v.literal("disposables"),
      v.literal("reagents"),
      v.literal("electrodes"),
      v.literal("filters"),
      v.literal("lubricants"),
      v.literal("cleaning_agents"),
      v.literal("other"),
    ),
    // vi: "Tồn kho hiện tại" / en: "Current stock"
    currentStock: v.number(),
    // vi: "Mức tồn tối thiểu" / en: "Minimum stock level (par level)"
    parLevel: v.number(),
    // vi: "Mức tồn tối đa" / en: "Maximum stock level"
    maxLevel: v.optional(v.number()),
    // vi: "Điểm đặt hàng lại" / en: "Reorder point"
    reorderPoint: v.number(),
    // vi: "Chi phí đơn vị (VND)" / en: "Unit cost (VND)"
    unitCost: v.optional(v.number()),
    // Optional link to equipment that uses this consumable
    relatedEquipmentId: v.optional(v.id("equipment")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_category", ["organizationId", "categoryType"])
    .index("by_org_and_sku", ["organizationId", "sku"]),

  /**
   * Transaction log for consumable stock movements.
   * vi: "Nhật ký sử dụng vật tư" / en: "Consumable usage log"
   *
   * transactionType enum:
   *   RECEIVE    - vi: "Nhận hàng"    / en: "Receive"
   *   USAGE      - vi: "Sử dụng"      / en: "Usage"
   *   ADJUSTMENT - vi: "Điều chỉnh"   / en: "Adjustment"
   *   WRITE_OFF  - vi: "Xóa sổ"       / en: "Write-off"
   *   EXPIRED    - vi: "Hết hạn"      / en: "Expired"
   */
  consumableUsageLog: defineTable({
    consumableId: v.id("consumables"),
    quantity: v.number(),
    // vi: "Loại giao dịch" / en: "Transaction type"
    transactionType: v.union(
      v.literal("RECEIVE"),
      v.literal("USAGE"),
      v.literal("ADJUSTMENT"),
      v.literal("WRITE_OFF"),
      v.literal("EXPIRED"),
    ),
    usedBy: v.id("users"),
    // Optional: link to equipment this consumable was used with
    equipmentId: v.optional(v.id("equipment")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consumable", ["consumableId"])
    .index("by_used_by", ["usedBy"]),

  /**
   * Requests to reorder consumable stock.
   * vi: "Yêu cầu đặt hàng lại" / en: "Reorder requests"
   *
   * status enum:
   *   pending   - vi: "Đang chờ"      / en: "Pending"
   *   approved  - vi: "Đã duyệt"      / en: "Approved"
   *   ordered   - vi: "Đã đặt hàng"   / en: "Ordered"
   *   received  - vi: "Đã nhận"       / en: "Received"
   *   cancelled - vi: "Đã hủy"        / en: "Cancelled"
   */
  reorderRequests: defineTable({
    consumableId: v.id("consumables"),
    organizationId: v.id("organizations"),
    quantity: v.number(),
    // vi: "Trạng thái yêu cầu" / en: "Request status"
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("ordered"),
      v.literal("received"),
      v.literal("cancelled"),
    ),
    requestedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consumable", ["consumableId"])
    .index("by_org", ["organizationId"])
    .index("by_status", ["status"]),

  // ===========================================================================
  // DISPUTES DOMAIN (2 tables)
  // vi: "Lĩnh vực tranh chấp" / en: "Disputes domain"
  // ===========================================================================

  /**
   * Formal disputes raised against service request outcomes.
   * vi: "Tranh chấp" / en: "Disputes"
   *
   * status enum:
   *   open          - vi: "Mở"            / en: "Open"
   *   investigating - vi: "Đang điều tra"  / en: "Investigating"
   *   resolved      - vi: "Đã giải quyết"  / en: "Resolved"
   *   closed        - vi: "Đã đóng"        / en: "Closed"
   *   escalated     - vi: "Đã leo thang"   / en: "Escalated"
   *
   * type enum:
   *   quality  - vi: "Chất lượng"  / en: "Quality"
   *   pricing  - vi: "Giá cả"      / en: "Pricing"
   *   timeline - vi: "Thời hạn"    / en: "Timeline"
   *   other    - vi: "Khác"        / en: "Other"
   */
  disputes: defineTable({
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    raisedBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    // vi: "Trạng thái tranh chấp" / en: "Dispute status"
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("escalated"),
    ),
    // vi: "Loại tranh chấp" / en: "Dispute type"
    type: v.union(
      v.literal("quality"),
      v.literal("pricing"),
      v.literal("timeline"),
      v.literal("other"),
    ),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_service_request", ["serviceRequestId"]),

  /**
   * Messages within a dispute thread.
   * vi: "Tin nhắn tranh chấp" / en: "Dispute messages"
   */
  disputeMessages: defineTable({
    disputeId: v.id("disputes"),
    authorId: v.id("users"),
    contentVi: v.string(),
    contentEn: v.optional(v.string()),
    attachmentUrls: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dispute", ["disputeId"])
    .index("by_author", ["authorId"]),

  // ===========================================================================
  // SERVICE EXECUTION DOMAIN (1 table)
  // vi: "Lĩnh vực thực hiện dịch vụ" / en: "Service execution domain"
  // Added for M3-3: Provider service execution and completion reports
  // ===========================================================================

  /**
   * Structured completion reports submitted by providers after service execution.
   * vi: "Báo cáo hoàn thành dịch vụ" / en: "Service completion reports"
   *
   * WHY: Stored as structured data (not free text) for M3-4 analytics:
   *   - Parts replaced → inventory forecasting
   *   - Actual hours → labor cost tracking
   *   - Next maintenance → schedule planning
   *   - Photo URLs → evidence for dispute resolution
   *
   * Retention: 5 years per Vietnamese medical device regulations (Decree 36/2016).
   */
  completionReports: defineTable({
    serviceRequestId: v.id("serviceRequests"),
    // vi: "ID nhà cung cấp thực hiện" / en: "Provider who performed the service"
    providerId: v.optional(v.id("providers")),
    // vi: "Mô tả công việc đã thực hiện (tiếng Việt)" / en: "Work done (Vietnamese)"
    workDescriptionVi: v.string(),
    // vi: "Mô tả công việc đã thực hiện (tiếng Anh)" / en: "Work done (English)"
    workDescriptionEn: v.optional(v.string()),
    // vi: "Danh sách linh kiện đã thay thế" / en: "Parts replaced list"
    partsReplaced: v.optional(v.array(v.string())),
    // vi: "Khuyến nghị bảo trì tiếp theo" / en: "Next maintenance recommendation"
    nextMaintenanceRecommendation: v.optional(v.string()),
    // vi: "Số giờ thực tế" / en: "Actual hours spent"
    actualHours: v.optional(v.number()),
    // vi: "URL ảnh tài liệu" / en: "Photo documentation URLs"
    photoUrls: v.optional(v.array(v.string())),
    // vi: "Thời gian hoàn thành thực tế" / en: "Actual completion time" (epoch ms)
    actualCompletionTime: v.optional(v.number()),
    // vi: "Được gửi bởi" / en: "Submitted by"
    submittedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_service_request", ["serviceRequestId"])
    .index("by_provider", ["providerId"]),

  // ===========================================================================
  // AUDIT LOG DOMAIN (1 table)
  // vi: "Lĩnh vực nhật ký kiểm tra" / en: "Audit log domain"
  // ===========================================================================

  /**
   * Centralized cross-domain audit trail for compliance (5-year retention).
   * vi: "Nhật ký kiểm tra" / en: "Audit log"
   * Retention: Vietnamese medical device regulations require 5-year retention.
   *
   * action examples:
   *   "equipment.status_changed", "serviceRequest.created",
   *   "dispute.escalated", "user.role_changed"
   */
  auditLog: defineTable({
    organizationId: v.id("organizations"),
    actorId: v.id("users"),
    // vi: "Hành động" / en: "Action" (e.g. "equipment.status_changed")
    action: v.string(),
    // vi: "Loại tài nguyên" / en: "Resource type" (e.g. "equipment")
    resourceType: v.string(),
    // vi: "ID tài nguyên" / en: "Resource ID" (Convex ID as string)
    resourceId: v.string(),
    // vi: "Giá trị trước" / en: "Previous values"
    previousValues: v.optional(v.any()),
    // vi: "Giá trị mới" / en: "New values"
    newValues: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_action", ["organizationId", "action"])
    .index("by_actor", ["actorId"])
    .index("by_resource", ["resourceType", "resourceId"]),
});
