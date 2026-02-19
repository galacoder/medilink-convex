import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { type Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Helper: extract authenticated organizationId from JWT identity
// ---------------------------------------------------------------------------

/**
 * Gets the authenticated user identity and extracts organizationId.
 * Throws bilingual ConvexError if not authenticated.
 *
 * WHY: Every query/mutation in the QR code domain must be scoped to
 * the caller's active organization to enforce multi-tenant data isolation.
 *
 * vi: "Xác thực người dùng và lấy ID tổ chức" / en: "Authenticate and get organization ID"
 */
async function requireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ subject: string; organizationId: Id<"organizations"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError(
      "Không có quyền truy cập (Not authenticated)",
    );
  }
  const organizationId = identity.organizationId as Id<"organizations"> | null;
  if (!organizationId) {
    throw new ConvexError(
      "Không tìm thấy tổ chức trong phiên đăng nhập (No active organization in session)",
    );
  }
  return { subject: identity.subject as string, organizationId };
}

// ===========================================================================
// QUERIES (Read-only)
// vi: "Truy vấn (chỉ đọc)" / en: "Queries (read-only)"
// ===========================================================================

/**
 * Finds a QR code by its unique code string and joins equipment data.
 * Returns null if the code is not found or inactive.
 *
 * WHY: This is the primary scan result lookup — when a user scans a QR code,
 * the decoded string is passed here to retrieve the linked equipment.
 *
 * vi: "Lấy mã QR theo giá trị code" / en: "Get QR code by code value"
 */
export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const qrCode = await ctx.db
      .query("qrCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!qrCode || qrCode.organizationId !== organizationId) {
      return null;
    }

    const equipment = await ctx.db.get(qrCode.equipmentId);

    return { ...qrCode, equipment };
  },
});

/**
 * Returns the active QR code for a given equipment ID, org-scoped.
 * Returns null if no active QR code exists for this equipment.
 *
 * WHY: Used on the equipment detail page to display/download the QR code.
 * Org-scoping prevents leaking QR codes across tenants.
 *
 * vi: "Lấy mã QR đang hoạt động theo ID thiết bị" / en: "Get active QR code by equipment ID"
 */
export const getByEquipmentId = query({
  args: {
    equipmentId: v.id("equipment"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const qrCode = await ctx.db
      .query("qrCodes")
      .withIndex("by_equipment", (q) => q.eq("equipmentId", args.equipmentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!qrCode || qrCode.organizationId !== organizationId) {
      return null;
    }

    return qrCode;
  },
});

// ===========================================================================
// MUTATIONS (Write)
// vi: "Đột biến (ghi)" / en: "Mutations (write)"
// ===========================================================================

/**
 * Generates a unique QR code for an equipment item.
 * Returns the existing active QR code if one already exists.
 *
 * WHY: Idempotent generation prevents duplicate QR codes for the same
 * equipment if staff accidentally triggers generation multiple times.
 *
 * vi: "Tạo mã QR cho thiết bị" / en: "Generate QR code for equipment"
 */
export const generateQRCode = mutation({
  args: {
    equipmentId: v.id("equipment"),
  },
  handler: async (ctx, args) => {
    const { subject, organizationId } = await requireAuth(ctx);

    // Verify the equipment exists and belongs to this org
    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment || equipment.organizationId !== organizationId) {
      throw new ConvexError(
        "Thiết bị không tồn tại hoặc không thuộc tổ chức này (Equipment not found or does not belong to this organization)",
      );
    }

    // Check if an active QR code already exists — return it if so (idempotent)
    const existing = await ctx.db
      .query("qrCodes")
      .withIndex("by_equipment", (q) => q.eq("equipmentId", args.equipmentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return existing;
    }

    // Look up the user record to get the createdBy Id<"users">
    const creatorUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), subject))
      .first();

    if (!creatorUser) {
      throw new ConvexError(
        "Không tìm thấy người dùng (User record not found)",
      );
    }

    // Generate a unique code string as a URL for reliable parsing.
    // Format: https://medilink.app/equipment/{equipmentId}?org={orgId}&t={timestamp}
    // WHY: URL format is unambiguous — equipmentId is a distinct path segment,
    // so parsing never relies on delimiter assumptions about Convex ID characters.
    const code = `https://medilink.app/equipment/${args.equipmentId}?org=${organizationId}&t=${Date.now()}`;
    const now = Date.now();

    const qrCodeId = await ctx.db.insert("qrCodes", {
      equipmentId: args.equipmentId,
      organizationId,
      code,
      isActive: true,
      createdBy: creatorUser._id,
      createdAt: now,
      updatedAt: now,
    });

    const qrCode = await ctx.db.get(qrCodeId);
    return qrCode!;
  },
});

/**
 * Records a scan event in qrScanLog for audit trail.
 *
 * WHY: Every QR scan must be logged for compliance (Vietnamese medical
 * device regulations require usage audit trails). The action type
 * distinguishes between view-only scans and transactional scans.
 *
 * vi: "Ghi nhật ký quét mã QR" / en: "Record QR code scan event"
 */
export const recordScan = mutation({
  args: {
    qrCodeId: v.id("qrCodes"),
    action: v.union(
      v.literal("view"),
      v.literal("borrow"),
      v.literal("return"),
      v.literal("report_issue"),
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { subject, organizationId } = await requireAuth(ctx);

    // Verify the QR code exists and belongs to this organization
    const qrCode = await ctx.db.get(args.qrCodeId);
    if (!qrCode || qrCode.organizationId !== organizationId) {
      throw new ConvexError(
        "Mã QR không hợp lệ / Invalid QR code",
      );
    }

    // Look up the user record
    const scannerUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), subject))
      .first();

    if (!scannerUser) {
      throw new ConvexError(
        "Không tìm thấy người dùng (User record not found)",
      );
    }

    const now = Date.now();
    const logId = await ctx.db.insert("qrScanLog", {
      qrCodeId: args.qrCodeId,
      scannedBy: scannerUser._id,
      action: args.action,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    return logId;
  },
});

/**
 * Batch-generates QR codes for all equipment in a category that lack one.
 * Returns counts of generated vs skipped (already has QR code) items.
 *
 * WHY: Staff often needs to print QR codes for an entire category of equipment
 * at once (e.g., "all diagnostic devices"). This mutation provides that
 * bulk operation without requiring individual calls per equipment item.
 *
 * vi: "Tạo hàng loạt mã QR cho danh mục thiết bị" / en: "Batch generate QR codes for equipment category"
 */
export const batchGenerateQRCodes = mutation({
  args: {
    categoryId: v.id("equipmentCategories"),
  },
  handler: async (ctx, args) => {
    const { subject, organizationId } = await requireAuth(ctx);

    // Verify the category belongs to this org
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.organizationId !== organizationId) {
      throw new ConvexError(
        "Danh mục không tồn tại hoặc không thuộc tổ chức này (Category not found or does not belong to this organization)",
      );
    }

    // Look up the user record for createdBy
    const creatorUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), subject))
      .first();

    if (!creatorUser) {
      throw new ConvexError(
        "Không tìm thấy người dùng (User record not found)",
      );
    }

    // Get all equipment in this category for this org
    const allEquipment = await ctx.db
      .query("equipment")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    const orgEquipment = allEquipment.filter(
      (e) => e.organizationId === organizationId,
    );

    let generated = 0;
    let skipped = 0;
    const now = Date.now();

    for (const equipment of orgEquipment) {
      // Check if active QR code already exists
      const existing = await ctx.db
        .query("qrCodes")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipment._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Generate unique code as URL (same format as generateQRCode)
      const code = `https://medilink.app/equipment/${equipment._id}?org=${organizationId}&t=${now + generated}`;
      await ctx.db.insert("qrCodes", {
        equipmentId: equipment._id,
        organizationId,
        code,
        isActive: true,
        createdBy: creatorUser._id,
        createdAt: now,
        updatedAt: now,
      });
      generated++;
    }

    return { generated, skipped };
  },
});
