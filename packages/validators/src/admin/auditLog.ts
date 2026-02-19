import { z } from "zod/v4";

/**
 * Audit log action type enum.
 *
 * WHY: Audit entries use dot-notation actions (e.g., "equipment.status_changed")
 * but the filter UI groups them by category: create, update, delete, status_change.
 *
 * vi: "Loại hành động nhật ký" / en: "Audit log action type"
 *   create        - vi: "Tạo mới"          / en: "Create"
 *   update        - vi: "Cập nhật"         / en: "Update"
 *   delete        - vi: "Xóa"              / en: "Delete"
 *   status_change - vi: "Thay đổi trạng thái" / en: "Status Change"
 */
export const auditLogActionTypeSchema = z.enum([
  "create",
  "update",
  "delete",
  "status_change",
]);

/**
 * Audit log resource type enum for UI filtering.
 *
 * Maps to the resourceType field stored in the auditLog table.
 *
 * vi: "Loại tài nguyên nhật ký" / en: "Audit log resource type"
 *   equipment        - vi: "Thiết bị"          / en: "Equipment"
 *   service_request  - vi: "Yêu cầu dịch vụ"  / en: "Service Request"
 *   quote            - vi: "Báo giá"           / en: "Quote"
 *   dispute          - vi: "Khiếu nại"         / en: "Dispute"
 */
export const auditLogResourceTypeSchema = z.enum([
  "equipment",
  "service_request",
  "quote",
  "dispute",
]);

/**
 * Schema for filtering audit log entries.
 *
 * All fields are optional — an empty filter returns all entries
 * (subject to pagination limit).
 *
 * vi: "Bộ lọc nhật ký kiểm tra" / en: "Audit log filter"
 */
export const auditLogFilterSchema = z.object({
  /** Filter by action category. vi: "Loại hành động" / en: "Action type" */
  actionType: auditLogActionTypeSchema.optional(),

  /** Filter by resource type. vi: "Loại tài nguyên" / en: "Resource type" */
  resourceType: auditLogResourceTypeSchema.optional(),

  /**
   * Filter by organization ID (Convex ID string).
   * vi: "ID tổ chức" / en: "Organization ID"
   */
  organizationId: z.string().optional(),

  /**
   * Filter by actor (user ID).
   * vi: "ID người thực hiện" / en: "Actor user ID"
   */
  actorId: z.string().optional(),

  /**
   * Start of date range (epoch ms).
   * vi: "Ngày bắt đầu" / en: "Date from"
   */
  dateFrom: z.number().optional(),

  /**
   * End of date range (epoch ms).
   * vi: "Ngày kết thúc" / en: "Date to"
   */
  dateTo: z.number().optional(),

  /**
   * Full-text search on action and resource details.
   * vi: "Tìm kiếm toàn văn" / en: "Full-text search"
   */
  search: z.string().optional(),

  /**
   * Cursor for cursor-based pagination.
   * vi: "Con trỏ phân trang" / en: "Pagination cursor"
   */
  cursor: z.string().optional(),

  /**
   * Number of entries to return per page.
   * vi: "Số mục mỗi trang" / en: "Items per page"
   * Max 100 to prevent excessive data fetches.
   */
  limit: z
    .number()
    .int()
    .min(1)
    .max(100, {
      message:
        "Số mục mỗi trang không được vượt quá 100 (Limit cannot exceed 100)",
    })
    .default(50),
});

// TypeScript type inference exports
export type AuditLogActionType = z.infer<typeof auditLogActionTypeSchema>;
export type AuditLogResourceType = z.infer<typeof auditLogResourceTypeSchema>;
export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;
