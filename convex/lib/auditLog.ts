/**
 * Audit log helper utilities.
 *
 * WHY: Centralizes audit entry creation so all mutations follow the same
 * pattern. Vietnamese Decree 36/2016 requires 5-year retention of all medical
 * device service records — the audit log is the compliance trail.
 *
 * vi: "Tiện ích nhật ký kiểm tra" / en: "Audit log helper utilities"
 */

import type { GenericMutationCtx } from "convex/server";

import type { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Shape of an audit log entry.
 * Matches the auditLog table schema in convex/schema.ts.
 *
 * vi: "Dữ liệu nhật ký kiểm tra" / en: "Audit log entry data"
 */
export interface AuditEntryData {
  /** vi: "ID tổ chức" / en: "Organization ID scoping this entry" */
  organizationId: Id<"organizations">;
  /** vi: "ID người thực hiện" / en: "Actor (user performing the action)" */
  actorId: Id<"users">;
  /** vi: "Hành động" / en: "Action string, e.g. 'equipment.status_changed'" */
  action: string;
  /** vi: "Loại tài nguyên" / en: "Resource type, e.g. 'equipment'" */
  resourceType: string;
  /** vi: "ID tài nguyên" / en: "Resource ID as a string" */
  resourceId: string;
  /** vi: "Giá trị trước" / en: "Previous state snapshot (optional)" */
  previousValues?: Record<string, unknown>;
  /** vi: "Giá trị mới" / en: "New state snapshot (optional)" */
  newValues?: Record<string, unknown>;
  /** vi: "Địa chỉ IP" / en: "Client IP address (optional)" */
  ipAddress?: string;
  /** vi: "Tác nhân người dùng" / en: "User-Agent string (optional)" */
  userAgent?: string;
}

/**
 * Inserts a single audit log entry.
 *
 * Used by: convex/admin/serviceRequests.ts (createAuditEntry)
 *
 * vi: "Tạo mục nhật ký kiểm tra" / en: "Create audit log entry"
 */
export async function createAuditEntry(
  ctx: MutationCtx,
  entry: AuditEntryData,
): Promise<void> {
  const now = Date.now();
  await ctx.db.insert("auditLog", {
    organizationId: entry.organizationId,
    actorId: entry.actorId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    previousValues: entry.previousValues,
    newValues: entry.newValues,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Alias for createAuditEntry — used by convex/admin/providers.ts.
 *
 * WHY: Two naming conventions exist across different migration phases.
 * This alias keeps both callers working while the codebase is unified.
 *
 * vi: "Bí danh tạo nhật ký kiểm tra" / en: "Alias for createAuditEntry"
 */
export const createAuditLogEntry = createAuditEntry;
