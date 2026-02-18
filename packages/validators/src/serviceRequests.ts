import { z } from "zod/v4";

/**
 * Service request type enum.
 * vi: "Loại yêu cầu dịch vụ" / en: "Service request type"
 *   repair      - vi: "Sửa chữa"   / en: "Repair"
 *   maintenance - vi: "Bảo trì"    / en: "Maintenance"
 *   calibration - vi: "Hiệu chỉnh" / en: "Calibration"
 *   inspection  - vi: "Kiểm tra"   / en: "Inspection"
 *   installation - vi: "Lắp đặt"  / en: "Installation"
 *   other       - vi: "Khác"       / en: "Other"
 */
export const serviceRequestTypeSchema = z.enum([
  "repair",
  "maintenance",
  "calibration",
  "inspection",
  "installation",
  "other",
]);

/**
 * Service request status enum.
 * vi: "Trạng thái yêu cầu dịch vụ" / en: "Service request status"
 *   pending     - vi: "Đang chờ"        / en: "Pending"
 *   quoted      - vi: "Đã báo giá"      / en: "Quoted"
 *   accepted    - vi: "Đã chấp nhận"    / en: "Accepted"
 *   in_progress - vi: "Đang thực hiện"  / en: "In progress"
 *   completed   - vi: "Hoàn thành"      / en: "Completed"
 *   cancelled   - vi: "Đã hủy"          / en: "Cancelled"
 *   disputed    - vi: "Đang tranh chấp" / en: "Disputed"
 */
export const serviceRequestStatusSchema = z.enum([
  "pending",
  "quoted",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
]);

/**
 * Service request priority enum.
 * vi: "Mức ưu tiên yêu cầu" / en: "Service request priority"
 *   low      - vi: "Thấp"      / en: "Low"
 *   medium   - vi: "Trung bình" / en: "Medium"
 *   high     - vi: "Cao"       / en: "High"
 *   critical - vi: "Khẩn cấp"  / en: "Critical"
 */
export const serviceRequestPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * Quote status enum.
 * vi: "Trạng thái báo giá" / en: "Quote status"
 *   pending  - vi: "Đang chờ"     / en: "Pending"
 *   accepted - vi: "Đã chấp nhận" / en: "Accepted"
 *   rejected - vi: "Đã từ chối"   / en: "Rejected"
 *   expired  - vi: "Đã hết hạn"   / en: "Expired"
 */
export const quoteStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

/**
 * Schema for creating a service request.
 * vi: "Tạo yêu cầu dịch vụ" / en: "Create service request"
 */
export const createServiceRequestSchema = z.object({
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  equipmentId: z.string().min(1, {
    message: "ID thiết bị không được để trống (Equipment ID is required)",
  }),
  requestedBy: z.string().min(1, {
    message: "Người yêu cầu không được để trống (Requester ID is required)",
  }),
  assignedProviderId: z.string().optional(),
  type: serviceRequestTypeSchema,
  status: serviceRequestStatusSchema,
  priority: serviceRequestPrioritySchema,
  descriptionVi: z.string().min(10, {
    message:
      "Mô tả phải có ít nhất 10 ký tự (Description must be at least 10 characters)",
  }),
  descriptionEn: z.string().optional(),
  scheduledAt: z.number().optional(),
  completedAt: z.number().optional(),
});

/**
 * Schema for updating a service request (all fields optional).
 * vi: "Cập nhật yêu cầu dịch vụ" / en: "Update service request"
 */
export const updateServiceRequestSchema =
  createServiceRequestSchema.partial();

/**
 * Schema for creating a quote.
 * vi: "Tạo báo giá" / en: "Create quote"
 */
export const createQuoteSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  providerId: z.string().min(1, {
    message:
      "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  status: quoteStatusSchema,
  amount: z.number().min(0, {
    message: "Số tiền không được âm (Amount cannot be negative)",
  }),
  currency: z.string().min(1, {
    message: "Đơn vị tiền tệ không được để trống (Currency is required)",
  }),
  validUntil: z.number().optional(),
  notes: z.string().optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

/**
 * Schema for creating a service rating.
 * vi: "Tạo đánh giá dịch vụ" / en: "Create service rating"
 */
export const createServiceRatingSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  providerId: z.string().min(1, {
    message:
      "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  ratedBy: z.string().min(1, {
    message: "Người đánh giá không được để trống (Rater ID is required)",
  }),
  // vi: "Đánh giá từ 1 đến 5 sao" / en: "Rating 1-5 stars"
  rating: z.number().min(1, {
    message: "Điểm đánh giá tối thiểu là 1 (Minimum rating is 1)",
  }).max(5, {
    message: "Điểm đánh giá tối đa là 5 (Maximum rating is 5)",
  }),
  commentVi: z.string().optional(),
  commentEn: z.string().optional(),
  serviceQuality: z.number().min(1).max(5).optional(),
  timeliness: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
});

export const updateServiceRatingSchema = createServiceRatingSchema.partial();

// TypeScript type inference exports
export type ServiceRequestType = z.infer<typeof serviceRequestTypeSchema>;
export type ServiceRequestStatus = z.infer<typeof serviceRequestStatusSchema>;
export type ServiceRequestPriority = z.infer<
  typeof serviceRequestPrioritySchema
>;
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

export type CreateServiceRequestInput = z.infer<
  typeof createServiceRequestSchema
>;
export type UpdateServiceRequestInput = z.infer<
  typeof updateServiceRequestSchema
>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateServiceRatingInput = z.infer<
  typeof createServiceRatingSchema
>;
export type UpdateServiceRatingInput = z.infer<
  typeof updateServiceRatingSchema
>;
