/**
 * Audit log helper for Convex mutations.
 *
 * WHY: Vietnamese medical device regulations require 5-year retention of all
 * changes to equipment-related records. The auditLog table is the centralized
 * trail used by all domains. This helper ensures consistent log format across
 * all mutations.
 *
 * Two export names are provided for backwards compatibility:
 *   - createAuditLogEntry / AuditLogArgs  — M1-6 provider management pattern
 *   - createAuditEntry / AuditEntryInput  — M1-5 service request pattern
 * Both write identical rows to the auditLog table.
 *
 * vi: "Tiện ích nhật ký kiểm tra" / en: "Audit log helper"
 */

import type { GenericMutationCtx } from "convex/server";
import type { Id, DataModel } from "../_generated/dataModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Arguments for creating an audit log entry (M1-6 provider management pattern).
 * vi: "Tham số tạo bản ghi nhật ký" / en: "Audit log entry arguments"
 */
export interface AuditLogArgs {
  /** Organization that owns the resource. vi: "ID tổ chức" / en: "Organization ID" */
  organizationId: Id<"organizations">;
  /** User who performed the action. vi: "ID người thực hiện" / en: "Actor ID" */
  actorId: Id<"users">;
  /**
   * Dot-notation action name.
   * Examples: "provider.profile_updated", "serviceRequest.created"
   * vi: "Tên hành động" / en: "Action name"
   */
  action: string;
  /** Resource table name. vi: "Loại tài nguyên" / en: "Resource type" */
  resourceType: string;
  /** Convex document ID as string. vi: "ID tài nguyên" / en: "Resource ID" */
  resourceId: string;
  /** Values before the change (optional). vi: "Giá trị trước" / en: "Previous values" */
  previousValues?: Record<string, unknown>;
  /** Values after the change (optional). vi: "Giá trị mới" / en: "New values" */
  newValues?: Record<string, unknown>;
}

/**
 * Alias for AuditLogArgs — used by the M1-5 service request workflow.
 * Identical structure, different name for API clarity at the call site.
 */
export type AuditEntryInput = AuditLogArgs;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Insert an audit log entry into the auditLog table.
 *
 * WHY: Vietnamese medical device regulations require an immutable audit trail
 * for all changes to equipment and provider records. This helper is called
 * at the end of every mutation that modifies critical data.
 *
 * vi: "Tạo bản ghi nhật ký kiểm tra" / en: "Create audit log entry"
 *
 * @param ctx - Convex mutation context (write access required)
 * @param args - Audit log entry fields
 * @returns The ID of the created audit log document
 */
export async function createAuditLogEntry(
  ctx: GenericMutationCtx<DataModel>,
  args: AuditLogArgs,
): Promise<Id<"auditLog">> {
  const now = Date.now();

  return await ctx.db.insert("auditLog", {
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    previousValues: args.previousValues,
    newValues: args.newValues,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Alias for createAuditLogEntry — used by the M1-5 service request workflow.
 *
 * WHY: Must be called from within a Convex mutation (not a query or action)
 * since it writes to the database.
 */
export async function createAuditEntry(
  ctx: GenericMutationCtx<DataModel>,
  entry: AuditEntryInput,
): Promise<Id<"auditLog">> {
  return createAuditLogEntry(ctx, entry);
}
