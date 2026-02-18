import { z } from "zod/v4";

/**
 * Dispute status enum.
 * vi: "Trạng thái tranh chấp" / en: "Dispute status"
 *   open          - vi: "Mở"            / en: "Open"
 *   investigating - vi: "Đang điều tra"  / en: "Investigating"
 *   resolved      - vi: "Đã giải quyết"  / en: "Resolved"
 *   closed        - vi: "Đã đóng"        / en: "Closed"
 *   escalated     - vi: "Đã leo thang"   / en: "Escalated"
 */
export const disputeStatusSchema = z.enum([
  "open",
  "investigating",
  "resolved",
  "closed",
  "escalated",
]);

/**
 * Dispute type enum.
 * vi: "Loại tranh chấp" / en: "Dispute type"
 *   quality  - vi: "Chất lượng" / en: "Quality"
 *   pricing  - vi: "Giá cả"     / en: "Pricing"
 *   timeline - vi: "Thời hạn"   / en: "Timeline"
 *   other    - vi: "Khác"       / en: "Other"
 */
export const disputeTypeSchema = z.enum([
  "quality",
  "pricing",
  "timeline",
  "other",
]);

/**
 * Schema for creating a dispute.
 * vi: "Tạo tranh chấp" / en: "Create dispute"
 */
export const createDisputeSchema = z.object({
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  raisedBy: z.string().min(1, {
    message:
      "Người khiếu nại không được để trống (Complainant ID is required)",
  }),
  assignedTo: z.string().optional(),
  status: disputeStatusSchema,
  type: disputeTypeSchema,
  descriptionVi: z.string().min(20, {
    message:
      "Mô tả tranh chấp phải có ít nhất 20 ký tự (Dispute description must be at least 20 characters)",
  }),
  descriptionEn: z.string().optional(),
  resolvedAt: z.number().optional(),
  resolutionNotes: z.string().optional(),
});

/**
 * Schema for updating a dispute (all fields optional).
 * vi: "Cập nhật tranh chấp" / en: "Update dispute"
 */
export const updateDisputeSchema = createDisputeSchema.partial();

/**
 * Schema for adding a message to a dispute thread.
 * vi: "Thêm tin nhắn tranh chấp" / en: "Add dispute message"
 */
export const createDisputeMessageSchema = z.object({
  disputeId: z.string().min(1, {
    message: "ID tranh chấp không được để trống (Dispute ID is required)",
  }),
  authorId: z.string().min(1, {
    message: "ID tác giả không được để trống (Author ID is required)",
  }),
  contentVi: z.string().min(1, {
    message:
      "Nội dung tin nhắn không được để trống (Message content is required)",
  }),
  contentEn: z.string().optional(),
  attachmentUrls: z.array(z.string().url({
    message: "URL đính kèm không hợp lệ (Invalid attachment URL)",
  })).optional(),
});

export const updateDisputeMessageSchema =
  createDisputeMessageSchema.partial();

// TypeScript type inference exports
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;
export type DisputeType = z.infer<typeof disputeTypeSchema>;

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type UpdateDisputeInput = z.infer<typeof updateDisputeSchema>;
export type CreateDisputeMessageInput = z.infer<
  typeof createDisputeMessageSchema
>;
export type UpdateDisputeMessageInput = z.infer<
  typeof updateDisputeMessageSchema
>;
