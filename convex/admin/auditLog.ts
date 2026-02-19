/**
 * Convex queries for the platform admin audit log viewer.
 *
 * Access control: ALL queries require platform_admin role.
 * These are cross-tenant queries — platform admins can see ALL organizations' audit logs.
 *
 * Compliance: Vietnamese medical device regulations (Decree 36/2016) require
 * 5-year retention of equipment-related audit records.
 *
 * vi: "Truy vấn nhật ký kiểm tra cho quản trị viên nền tảng"
 * en: "Audit log queries for platform admin"
 */

import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that the caller is a platform_admin.
 * Throws a bilingual ConvexError if not authenticated or not a platform admin.
 *
 * WHY: All audit log queries are cross-tenant and highly sensitive —
 * they must be restricted to SangLeTech platform admins only.
 *
 * vi: "Yêu cầu quyền quản trị viên nền tảng" / en: "Require platform admin"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  const platformRole = identity.platformRole as string | undefined;
  if (platformRole !== "platform_admin") {
    throw new ConvexError({
      message:
        "Chỉ quản trị viên nền tảng mới có thể xem nhật ký kiểm tra. (Only platform admins can view audit logs.)",
      code: "FORBIDDEN",
    });
  }

  return { userId: identity.subject as string };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists audit log entries with optional filtering and cursor-based pagination.
 *
 * Supports filtering by:
 *   - resourceType: "equipment" | "disputes" | "serviceRequests" | "quotes"
 *   - organizationId: cross-tenant filter for a specific hospital/provider
 *   - actorId: filter by the user who performed the action
 *   - dateFrom / dateTo: epoch ms date range
 *   - search: simple substring match on the action string
 *
 * Returns:
 *   - entries: paginated audit log entries enriched with actor name and org name
 *   - cursor: next page cursor (null if done)
 *   - isDone: true when no more entries
 *   - totalCount: total matching entries
 *   - oldestEntryAt: timestamp of oldest entry (for retention indicator)
 *
 * vi: "Danh sách nhật ký kiểm tra" / en: "Audit log list"
 */
export const list = query({
  args: {
    resourceType: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    actorId: v.optional(v.id("users")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate — platform_admin only
    await requirePlatformAdmin(ctx);

    const pageSize = Math.min(args.limit ?? 50, 100);

    // Build base query — always ordered by createdAt descending (newest first)
    // WHY: Audit logs are read newest-first for incident investigation.
    let baseQuery;

    if (args.organizationId) {
      baseQuery = ctx.db
        .query("auditLog")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId!));
    } else if (args.actorId) {
      baseQuery = ctx.db
        .query("auditLog")
        .withIndex("by_actor", (q) => q.eq("actorId", args.actorId!));
    } else {
      baseQuery = ctx.db.query("auditLog");
    }

    // Collect all matching entries (apply in-memory filters for flexibility)
    // WHY: Convex does not support compound multi-filter queries without
    // a matching compound index. The audit log volume is bounded by retention
    // policy (5 years), and platform admin queries are infrequent.
    let allEntries = await baseQuery.order("desc").collect();

    // Apply additional in-memory filters
    if (args.resourceType) {
      allEntries = allEntries.filter(
        (e) => e.resourceType === args.resourceType,
      );
    }

    if (args.dateFrom !== undefined) {
      allEntries = allEntries.filter((e) => e.createdAt >= args.dateFrom!);
    }

    if (args.dateTo !== undefined) {
      allEntries = allEntries.filter((e) => e.createdAt <= args.dateTo!);
    }

    if (args.search) {
      const needle = args.search.toLowerCase();
      allEntries = allEntries.filter(
        (e) =>
          e.action.toLowerCase().includes(needle) ||
          e.resourceType.toLowerCase().includes(needle) ||
          e.resourceId.toLowerCase().includes(needle),
      );
    }

    // Compute retention metadata before pagination
    // WHY: totalCount and oldestEntryAt are shown in the UI as retention indicators.
    const totalCount = allEntries.length;
    const oldestEntry = allEntries.at(-1); // sorted desc, so oldest is last
    const oldestEntryAt = oldestEntry?.createdAt ?? null;

    // Apply cursor-based pagination
    let startIndex = 0;
    if (args.cursor) {
      // Cursor encodes the index of the next page start
      startIndex = parseInt(args.cursor, 10);
    }

    const pageEntries = allEntries.slice(startIndex, startIndex + pageSize);
    const nextIndex = startIndex + pageSize;
    const isDone = nextIndex >= allEntries.length;
    const nextCursor = isDone ? null : String(nextIndex);

    // Enrich entries with actor name and organization name
    const enriched = await Promise.all(
      pageEntries.map(async (entry) => {
        const [actor, org] = await Promise.all([
          ctx.db.get(entry.actorId),
          ctx.db.get(entry.organizationId),
        ]);
        return {
          ...entry,
          actorName: actor?.name ?? null,
          actorEmail: actor?.email ?? null,
          organizationName: org?.name ?? null,
        };
      }),
    );

    return {
      entries: enriched,
      cursor: nextCursor,
      isDone,
      totalCount,
      oldestEntryAt,
    };
  },
});

/**
 * Gets a single audit log entry by ID with full JSON payload.
 *
 * Returns the complete entry including previousValues and newValues,
 * enriched with actor name and organization name.
 *
 * Returns null if not found.
 *
 * vi: "Lấy bản ghi nhật ký theo ID" / en: "Get audit log entry by ID"
 */
export const getById = query({
  args: {
    id: v.id("auditLog"),
  },
  handler: async (ctx, args) => {
    // Authenticate — platform_admin only
    await requirePlatformAdmin(ctx);

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      return null;
    }

    // Enrich with actor and organization details
    const [actor, org] = await Promise.all([
      ctx.db.get(entry.actorId),
      ctx.db.get(entry.organizationId),
    ]);

    return {
      ...entry,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      organizationName: org?.name ?? null,
    };
  },
});

/**
 * Exports audit log entries as a CSV string with bilingual headers.
 *
 * Applies the same filters as `list` but returns all matching entries
 * (no pagination) formatted as CSV for download.
 *
 * CSV columns:
 *   Thời gian / Timestamp, Người thực hiện / Actor,
 *   Hành động / Action, Loại tài nguyên / Resource Type,
 *   ID tài nguyên / Resource ID, Tổ chức / Organization
 *
 * WHY: Vietnamese medical device regulations require the ability to export
 * compliance reports. CSV is the standard format for dual-column reporting.
 *
 * vi: "Xuất nhật ký kiểm tra ra CSV" / en: "Export audit log as CSV"
 */
export const exportCSV = query({
  args: {
    resourceType: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    actorId: v.optional(v.id("users")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate — platform_admin only
    await requirePlatformAdmin(ctx);

    // Collect all matching entries (no pagination for export)
    let allEntries = await ctx.db.query("auditLog").order("desc").collect();

    // Apply same filters as list
    if (args.organizationId) {
      allEntries = allEntries.filter(
        (e) => e.organizationId === args.organizationId,
      );
    }

    if (args.actorId) {
      allEntries = allEntries.filter((e) => e.actorId === args.actorId);
    }

    if (args.resourceType) {
      allEntries = allEntries.filter(
        (e) => e.resourceType === args.resourceType,
      );
    }

    if (args.dateFrom !== undefined) {
      allEntries = allEntries.filter((e) => e.createdAt >= args.dateFrom!);
    }

    if (args.dateTo !== undefined) {
      allEntries = allEntries.filter((e) => e.createdAt <= args.dateTo!);
    }

    if (args.search) {
      const needle = args.search.toLowerCase();
      allEntries = allEntries.filter(
        (e) =>
          e.action.toLowerCase().includes(needle) ||
          e.resourceType.toLowerCase().includes(needle) ||
          e.resourceId.toLowerCase().includes(needle),
      );
    }

    // Enrich with actor and org names
    const enriched = await Promise.all(
      allEntries.map(async (entry) => {
        const [actor, org] = await Promise.all([
          ctx.db.get(entry.actorId),
          ctx.db.get(entry.organizationId),
        ]);
        return {
          ...entry,
          actorName: actor?.name ?? "",
          actorEmail: actor?.email ?? "",
          organizationName: org?.name ?? "",
        };
      }),
    );

    // Build CSV with bilingual headers (Vietnamese / English)
    // WHY: Dual-column headers required for Vietnamese medical compliance exports.
    const headers = [
      "Thời gian / Timestamp",
      "Người thực hiện / Actor",
      "Email người thực hiện / Actor Email",
      "Hành động / Action",
      "Loại tài nguyên / Resource Type",
      "ID tài nguyên / Resource ID",
      "Tổ chức / Organization",
    ];

    const escapeCsv = (value: string): string => {
      // Escape double quotes and wrap in quotes if needed
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = enriched.map((entry) => {
      const timestamp = new Date(entry.createdAt).toISOString();
      return [
        escapeCsv(timestamp),
        escapeCsv(entry.actorName),
        escapeCsv(entry.actorEmail),
        escapeCsv(entry.action),
        escapeCsv(entry.resourceType),
        escapeCsv(entry.resourceId),
        escapeCsv(entry.organizationName),
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  },
});
