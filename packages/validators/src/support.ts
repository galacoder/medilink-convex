import { z } from "zod/v4";

/**
 * Support ticket status enum.
 * vi: "Trạng thái phiếu hỗ trợ" / en: "Support ticket status"
 *   open        - vi: "Mở"              / en: "Open"
 *   in_progress - vi: "Đang xử lý"     / en: "In progress"
 *   resolved    - vi: "Đã giải quyết"  / en: "Resolved"
 *   closed      - vi: "Đã đóng"        / en: "Closed"
 */
export const supportTicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

/**
 * Support ticket priority enum.
 * vi: "Mức độ ưu tiên" / en: "Priority"
 *   low      - vi: "Thấp"      / en: "Low"
 *   medium   - vi: "Trung bình" / en: "Medium"
 *   high     - vi: "Cao"       / en: "High"
 *   critical - vi: "Khẩn cấp" / en: "Critical"
 */
export const supportTicketPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * Support ticket category enum.
 * vi: "Danh mục phiếu hỗ trợ" / en: "Support ticket category"
 *   general         - vi: "Chung"             / en: "General"
 *   technical       - vi: "Kỹ thuật"          / en: "Technical"
 *   billing         - vi: "Thanh toán"        / en: "Billing"
 *   feature_request - vi: "Yêu cầu tính năng" / en: "Feature request"
 *   other           - vi: "Khác"              / en: "Other"
 */
export const supportTicketCategorySchema = z.enum([
  "general",
  "technical",
  "billing",
  "feature_request",
  "other",
]);

/**
 * Schema for creating a support ticket.
 * vi: "Tạo phiếu hỗ trợ" / en: "Create support ticket"
 */
export const createSupportTicketSchema = z.object({
  subjectVi: z.string().min(3, {
    message:
      "Tiêu đề phải có ít nhất 3 ký tự (Subject must be at least 3 characters)",
  }),
  subjectEn: z.string().optional(),
  descriptionVi: z.string().min(10, {
    message:
      "Mô tả phải có ít nhất 10 ký tự (Description must be at least 10 characters)",
  }),
  descriptionEn: z.string().optional(),
  category: supportTicketCategorySchema,
  priority: supportTicketPrioritySchema.default("medium"),
});

/**
 * Schema for updating a support ticket (all fields optional).
 * vi: "Cập nhật phiếu hỗ trợ" / en: "Update support ticket"
 */
export const updateSupportTicketSchema = createSupportTicketSchema.partial();

/**
 * Schema for updating support ticket status.
 * vi: "Cập nhật trạng thái phiếu hỗ trợ" / en: "Update support ticket status"
 */
export const updateSupportTicketStatusSchema = z.object({
  ticketId: z.string().min(1, {
    message: "ID phiếu hỗ trợ không được để trống (Ticket ID is required)",
  }),
  status: supportTicketStatusSchema,
});

/**
 * Schema for adding a message to a support ticket thread.
 * vi: "Thêm tin nhắn vào phiếu hỗ trợ" / en: "Add support message"
 */
export const createSupportMessageSchema = z.object({
  ticketId: z.string().min(1, {
    message: "ID phiếu hỗ trợ không được để trống (Ticket ID is required)",
  }),
  contentVi: z.string().min(1, {
    message: "Nội dung không được để trống (Content cannot be empty)",
  }),
  contentEn: z.string().optional(),
  attachmentUrls: z
    .array(
      z.string().url({
        message: "URL đính kèm không hợp lệ (Invalid attachment URL)",
      }),
    )
    .optional(),
});

// TypeScript type inference exports
export type SupportTicketStatus = z.infer<typeof supportTicketStatusSchema>;
export type SupportTicketPriority = z.infer<typeof supportTicketPrioritySchema>;
export type SupportTicketCategory = z.infer<typeof supportTicketCategorySchema>;
export type CreateSupportTicketInput = z.infer<
  typeof createSupportTicketSchema
>;
export type UpdateSupportTicketInput = z.infer<
  typeof updateSupportTicketSchema
>;
export type UpdateSupportTicketStatusInput = z.infer<
  typeof updateSupportTicketStatusSchema
>;
export type CreateSupportMessageInput = z.infer<
  typeof createSupportMessageSchema
>;
