import { z } from "zod/v4";

/**
 * Equipment status enum.
 * vi: "Trạng thái thiết bị" / en: "Equipment status"
 *   available   - vi: "Sẵn sàng"     / en: "Available"
 *   in_use      - vi: "Đang sử dụng" / en: "In use"
 *   maintenance - vi: "Bảo trì"      / en: "Under maintenance"
 *   damaged     - vi: "Hỏng"         / en: "Damaged"
 *   retired     - vi: "Đã nghỉ hưu"  / en: "Retired"
 */
export const equipmentStatusSchema = z.enum([
  "available",
  "in_use",
  "maintenance",
  "damaged",
  "retired",
]);

/**
 * Equipment condition enum.
 * vi: "Tình trạng thiết bị" / en: "Equipment condition"
 *   excellent - vi: "Xuất sắc"   / en: "Excellent"
 *   good      - vi: "Tốt"        / en: "Good"
 *   fair      - vi: "Trung bình" / en: "Fair"
 *   poor      - vi: "Kém"        / en: "Poor"
 */
export const equipmentConditionSchema = z.enum([
  "excellent",
  "good",
  "fair",
  "poor",
]);

/**
 * Equipment criticality enum (ABC analysis).
 * vi: "Mức độ quan trọng" / en: "Criticality"
 *   A - vi: "Quan trọng cao"  / en: "High criticality"
 *   B - vi: "Quan trọng vừa"  / en: "Medium criticality"
 *   C - vi: "Quan trọng thấp" / en: "Low criticality"
 */
export const criticalitySchema = z.enum(["A", "B", "C"]);

/**
 * Maintenance type enum.
 * vi: "Loại bảo trì" / en: "Maintenance type"
 *   preventive  - vi: "Phòng ngừa" / en: "Preventive"
 *   corrective  - vi: "Sửa chữa"   / en: "Corrective"
 *   inspection  - vi: "Kiểm tra"   / en: "Inspection"
 *   calibration - vi: "Hiệu chỉnh" / en: "Calibration"
 */
export const maintenanceTypeSchema = z.enum([
  "preventive",
  "corrective",
  "inspection",
  "calibration",
]);

/**
 * Maintenance status enum.
 * vi: "Trạng thái bảo trì" / en: "Maintenance status"
 *   scheduled   - vi: "Đã lên lịch"    / en: "Scheduled"
 *   in_progress - vi: "Đang thực hiện" / en: "In progress"
 *   completed   - vi: "Hoàn thành"     / en: "Completed"
 *   overdue     - vi: "Quá hạn"        / en: "Overdue"
 *   cancelled   - vi: "Đã hủy"         / en: "Cancelled"
 */
export const maintenanceStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "overdue",
  "cancelled",
]);

/**
 * Recurring maintenance pattern enum.
 * vi: "Mẫu lặp lại bảo trì" / en: "Recurring maintenance pattern"
 */
export const recurringPatternSchema = z.enum([
  "none",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annually",
]);

/**
 * Failure report urgency enum.
 * vi: "Mức độ khẩn cấp sự cố" / en: "Failure urgency"
 *   low      - vi: "Thấp"     / en: "Low"
 *   medium   - vi: "Trung bình" / en: "Medium"
 *   high     - vi: "Cao"      / en: "High"
 *   critical - vi: "Khẩn cấp" / en: "Critical"
 */
export const failureUrgencySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * Failure report status enum.
 * vi: "Trạng thái sự cố" / en: "Failure status"
 */
export const failureStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
]);

/**
 * Schema for creating a new equipment category.
 * vi: "Tạo danh mục thiết bị" / en: "Create equipment category"
 */
export const createEquipmentCategorySchema = z.object({
  nameVi: z.string().min(2, {
    message:
      "Tên danh mục phải có ít nhất 2 ký tự (Category name must be at least 2 characters)",
  }),
  nameEn: z.string().min(2, {
    message:
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)",
  }),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
});

export const updateEquipmentCategorySchema =
  createEquipmentCategorySchema.partial();

/**
 * Schema for creating new equipment.
 * vi: "Tạo thiết bị mới" / en: "Create equipment"
 */
export const createEquipmentSchema = z.object({
  nameVi: z.string().min(2, {
    message:
      "Tên thiết bị phải có ít nhất 2 ký tự (Equipment name must be at least 2 characters)",
  }),
  nameEn: z.string().min(2, {
    message:
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)",
  }),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.string().min(1, {
    message: "ID danh mục không được để trống (Category ID is required)",
  }),
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  status: equipmentStatusSchema,
  condition: equipmentConditionSchema,
  criticality: criticalitySchema,
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  // epoch ms timestamps for dates
  purchaseDate: z.number().optional(),
  warrantyExpiryDate: z.number().optional(),
  location: z.string().optional(),
});

/**
 * Schema for updating existing equipment (all fields optional).
 * vi: "Cập nhật thiết bị" / en: "Update equipment"
 */
export const updateEquipmentSchema = createEquipmentSchema.partial();

/**
 * Schema for creating a maintenance record.
 * vi: "Tạo hồ sơ bảo trì" / en: "Create maintenance record"
 */
export const createMaintenanceSchema = z.object({
  equipmentId: z.string().min(1, {
    message: "ID thiết bị không được để trống (Equipment ID is required)",
  }),
  type: maintenanceTypeSchema,
  status: maintenanceStatusSchema,
  recurringPattern: recurringPatternSchema,
  // epoch ms
  scheduledAt: z.number({
    error: "Ngày lên lịch không hợp lệ (Invalid scheduled date)",
  }),
  completedAt: z.number().optional(),
  technicianId: z.string().optional(),
  technicianNotes: z.string().optional(),
  cost: z
    .number()
    .min(0, {
      message: "Chi phí không được âm (Cost cannot be negative)",
    })
    .optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

/**
 * Schema for creating a failure report.
 * vi: "Tạo báo cáo sự cố" / en: "Create failure report"
 */
export const createFailureReportSchema = z.object({
  equipmentId: z.string().min(1, {
    message: "ID thiết bị không được để trống (Equipment ID is required)",
  }),
  urgency: failureUrgencySchema,
  status: failureStatusSchema,
  descriptionVi: z.string().min(10, {
    message:
      "Mô tả sự cố phải có ít nhất 10 ký tự (Failure description must be at least 10 characters)",
  }),
  descriptionEn: z.string().optional(),
  reportedBy: z.string().min(1, {
    message: "Người báo cáo không được để trống (Reporter ID is required)",
  }),
  assignedTo: z.string().optional(),
  resolvedAt: z.number().optional(),
  resolutionNotes: z.string().optional(),
});

export const updateFailureReportSchema = createFailureReportSchema.partial();

// TypeScript type inference exports
export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;
export type EquipmentCondition = z.infer<typeof equipmentConditionSchema>;
export type Criticality = z.infer<typeof criticalitySchema>;
export type MaintenanceType = z.infer<typeof maintenanceTypeSchema>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;
export type RecurringPattern = z.infer<typeof recurringPatternSchema>;
export type FailureUrgency = z.infer<typeof failureUrgencySchema>;
export type FailureStatus = z.infer<typeof failureStatusSchema>;

export type CreateEquipmentCategoryInput = z.infer<
  typeof createEquipmentCategorySchema
>;
export type UpdateEquipmentCategoryInput = z.infer<
  typeof updateEquipmentCategorySchema
>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CreateFailureReportInput = z.infer<
  typeof createFailureReportSchema
>;
export type UpdateFailureReportInput = z.infer<
  typeof updateFailureReportSchema
>;
