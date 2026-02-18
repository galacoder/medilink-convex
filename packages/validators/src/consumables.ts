import { z } from "zod/v4";

/**
 * Consumable category type enum (7 values).
 * vi: "Loại danh mục vật tư tiêu hao" / en: "Consumable category type"
 *   disposables     - vi: "Dùng một lần"   / en: "Disposables"
 *   reagents        - vi: "Hóa chất"        / en: "Reagents"
 *   electrodes      - vi: "Điện cực"        / en: "Electrodes"
 *   filters         - vi: "Bộ lọc"          / en: "Filters"
 *   lubricants      - vi: "Chất bôi trơn"   / en: "Lubricants"
 *   cleaning_agents - vi: "Chất tẩy rửa"    / en: "Cleaning agents"
 *   other           - vi: "Khác"            / en: "Other"
 */
export const consumableCategoryTypeSchema = z.enum([
  "disposables",
  "reagents",
  "electrodes",
  "filters",
  "lubricants",
  "cleaning_agents",
  "other",
]);

/**
 * Consumable transaction type enum.
 * vi: "Loại giao dịch vật tư" / en: "Consumable transaction type"
 *   RECEIVE    - vi: "Nhận hàng" / en: "Receive"
 *   USAGE      - vi: "Sử dụng"   / en: "Usage"
 *   ADJUSTMENT - vi: "Điều chỉnh" / en: "Adjustment"
 *   WRITE_OFF  - vi: "Xóa sổ"    / en: "Write-off"
 *   EXPIRED    - vi: "Hết hạn"   / en: "Expired"
 */
export const transactionTypeSchema = z.enum([
  "RECEIVE",
  "USAGE",
  "ADJUSTMENT",
  "WRITE_OFF",
  "EXPIRED",
]);

/**
 * Reorder request status enum.
 * vi: "Trạng thái đặt hàng lại" / en: "Reorder request status"
 *   pending   - vi: "Đang chờ"    / en: "Pending"
 *   approved  - vi: "Đã duyệt"    / en: "Approved"
 *   ordered   - vi: "Đã đặt hàng" / en: "Ordered"
 *   received  - vi: "Đã nhận"     / en: "Received"
 *   cancelled - vi: "Đã hủy"      / en: "Cancelled"
 */
export const reorderStatusSchema = z.enum([
  "pending",
  "approved",
  "ordered",
  "received",
  "cancelled",
]);

/**
 * Schema for creating a consumable item.
 * vi: "Tạo vật tư tiêu hao" / en: "Create consumable"
 */
export const createConsumableSchema = z.object({
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  nameVi: z.string().min(2, {
    message:
      "Tên vật tư phải có ít nhất 2 ký tự (Consumable name must be at least 2 characters)",
  }),
  nameEn: z.string().min(2, {
    message:
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)",
  }),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  unitOfMeasure: z.string().min(1, {
    message: "Đơn vị tính không được để trống (Unit of measure is required)",
  }),
  categoryType: consumableCategoryTypeSchema,
  currentStock: z.number().min(0, {
    message: "Tồn kho không được âm (Current stock cannot be negative)",
  }),
  parLevel: z.number().min(1, {
    message:
      "Mức tồn tối thiểu phải lớn hơn 0 (Par level must be greater than 0)",
  }),
  maxLevel: z.number().min(1, {
    message: "Mức tồn tối đa phải lớn hơn 0 (Max level must be greater than 0)",
  }).optional(),
  reorderPoint: z.number().min(1, {
    message:
      "Điểm đặt hàng lại phải lớn hơn 0 (Reorder point must be greater than 0)",
  }),
  unitCost: z.number().min(0, {
    message: "Chi phí đơn vị không được âm (Unit cost cannot be negative)",
  }).optional(),
  relatedEquipmentId: z.string().optional(),
});

/**
 * Schema for updating a consumable (all fields optional).
 * vi: "Cập nhật vật tư tiêu hao" / en: "Update consumable"
 */
export const updateConsumableSchema = createConsumableSchema.partial();

/**
 * Schema for logging a consumable usage transaction.
 * vi: "Ghi nhật ký giao dịch vật tư" / en: "Log consumable transaction"
 */
export const createConsumableUsageLogSchema = z.object({
  consumableId: z.string().min(1, {
    message: "ID vật tư không được để trống (Consumable ID is required)",
  }),
  quantity: z.number().min(0, {
    message: "Số lượng không được âm (Quantity cannot be negative)",
  }),
  transactionType: transactionTypeSchema,
  usedBy: z.string().min(1, {
    message: "Người dùng không được để trống (User ID is required)",
  }),
  equipmentId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for creating a reorder request.
 * vi: "Tạo yêu cầu đặt hàng lại" / en: "Create reorder request"
 */
export const createReorderRequestSchema = z.object({
  consumableId: z.string().min(1, {
    message: "ID vật tư không được để trống (Consumable ID is required)",
  }),
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  quantity: z.number().min(1, {
    message:
      "Số lượng yêu cầu phải ít nhất 1 (Requested quantity must be at least 1)",
  }),
  status: reorderStatusSchema,
  requestedBy: z.string().min(1, {
    message: "Người yêu cầu không được để trống (Requester ID is required)",
  }),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const updateReorderRequestSchema =
  createReorderRequestSchema.partial();

// TypeScript type inference exports
export type ConsumableCategoryType = z.infer<
  typeof consumableCategoryTypeSchema
>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type ReorderStatus = z.infer<typeof reorderStatusSchema>;

export type CreateConsumableInput = z.infer<typeof createConsumableSchema>;
export type UpdateConsumableInput = z.infer<typeof updateConsumableSchema>;
export type CreateConsumableUsageLogInput = z.infer<
  typeof createConsumableUsageLogSchema
>;
export type CreateReorderRequestInput = z.infer<
  typeof createReorderRequestSchema
>;
export type UpdateReorderRequestInput = z.infer<
  typeof updateReorderRequestSchema
>;
