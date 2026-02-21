import { z } from "zod/v4";

/**
 * Notification type enum.
 * vi: "Loại thông báo" / en: "Notification type"
 *
 * service_request_new_quote      - vi: "Báo giá mới nhận được"         / en: "New quote received"
 * service_request_quote_approved - vi: "Báo giá đã được chấp thuận"     / en: "Quote approved"
 * service_request_quote_rejected - vi: "Báo giá đã bị từ chối"          / en: "Quote rejected"
 * service_request_started        - vi: "Dịch vụ đã bắt đầu"             / en: "Service started"
 * service_request_completed      - vi: "Dịch vụ đã hoàn thành"          / en: "Service completed"
 * equipment_maintenance_due      - vi: "Bảo trì thiết bị đến hạn"       / en: "Equipment maintenance due"
 * equipment_status_broken        - vi: "Thiết bị bị hỏng"               / en: "Equipment broken"
 * consumable_stock_low           - vi: "Vật tư dưới mức tối thiểu"       / en: "Consumable stock low"
 * dispute_new_message            - vi: "Tin nhắn tranh chấp mới"         / en: "New dispute message"
 * dispute_resolved               - vi: "Tranh chấp đã được giải quyết"   / en: "Dispute resolved"
 */
export const notificationTypeSchema = z.enum([
  "service_request_new_quote",
  "service_request_quote_approved",
  "service_request_quote_rejected",
  "service_request_started",
  "service_request_completed",
  "equipment_maintenance_due",
  "equipment_status_broken",
  "consumable_stock_low",
  "dispute_new_message",
  "dispute_resolved",
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

/**
 * Schema for creating a notification.
 * vi: "Tạo thông báo" / en: "Create notification"
 */
export const createNotificationSchema = z.object({
  userId: z.string().min(1, {
    message: "ID người dùng không được để trống (User ID is required)",
  }),
  type: notificationTypeSchema,
  // Bilingual title
  titleVi: z.string().min(1, {
    message:
      "Tiêu đề (tiếng Việt) không được để trống (Vietnamese title is required)",
  }),
  titleEn: z.string().min(1, {
    message:
      "Tiêu đề (tiếng Anh) không được để trống (English title is required)",
  }),
  // Bilingual body
  bodyVi: z.string().min(1, {
    message:
      "Nội dung (tiếng Việt) không được để trống (Vietnamese body is required)",
  }),
  bodyEn: z.string().min(1, {
    message:
      "Nội dung (tiếng Anh) không được để trống (English body is required)",
  }),
  // Optional metadata for deep linking or context
  // vi: "Siêu dữ liệu" / en: "Metadata"
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * Schema for updating notification preferences (per-type toggle).
 * vi: "Cập nhật tùy chọn thông báo" / en: "Update notification preferences"
 *
 * All keys are optional — supports partial updates (only specified types are changed).
 */
export const updateNotificationPreferencesSchema = z.object({
  service_request_new_quote: z.boolean().optional(),
  service_request_quote_approved: z.boolean().optional(),
  service_request_quote_rejected: z.boolean().optional(),
  service_request_started: z.boolean().optional(),
  service_request_completed: z.boolean().optional(),
  equipment_maintenance_due: z.boolean().optional(),
  equipment_status_broken: z.boolean().optional(),
  consumable_stock_low: z.boolean().optional(),
  dispute_new_message: z.boolean().optional(),
  dispute_resolved: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
