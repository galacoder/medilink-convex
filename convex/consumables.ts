import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { type Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { checkOrgRateLimit } from "./lib/rateLimit";

// ---------------------------------------------------------------------------
// Helper: extract authenticated organizationId from JWT identity
// vi: "Lấy ID tổ chức từ phiên đăng nhập" / en: "Get organizationId from session"
// ---------------------------------------------------------------------------

async function requireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ subject: string; organizationId: Id<"organizations"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Không có quyền truy cập (Not authenticated)");
  }

  const jwtOrgId = identity.organizationId as Id<"organizations"> | null;
  if (jwtOrgId) {
    return { subject: identity.subject as string, organizationId: jwtOrgId };
  }

  // JWT fallback: Better Auth Convex component cannot store activeOrganizationId.
  // M6: Dual lookup — try tokenIdentifier first (secure), then email index (fallback).
  const tokenIdentifier = identity.tokenIdentifier as string | null | undefined;
  const email = identity.email as string | null | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;

  if (tokenIdentifier) {
    user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
  }

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    // Backfill tokenIdentifier for next time (mutation ctx only).
    if (user && tokenIdentifier && "patch" in ctx.db) {
      await (ctx.db as any).patch(user._id, { tokenIdentifier });
    }
  }

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (membership) {
      return {
        subject: identity.subject as string,
        organizationId: membership.orgId as Id<"organizations">,
      };
    }
  }

  throw new ConvexError(
    "Không tìm thấy tổ chức trong phiên đăng nhập (No active organization in session)",
  );
}

// ===========================================================================
// QUERIES (Read-only)
// vi: "Truy vấn (chỉ đọc)" / en: "Queries (read-only)"
// ===========================================================================

/**
 * Lists consumables with cursor-based pagination, scoped to the caller's org.
 * Supports filtering by categoryType, stock level, and text search (vi/en names).
 *
 * vi: "Danh sách vật tư tiêu hao có phân trang" / en: "Paginated consumables list"
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryType: v.optional(
      v.union(
        v.literal("disposables"),
        v.literal("reagents"),
        v.literal("electrodes"),
        v.literal("filters"),
        v.literal("lubricants"),
        v.literal("cleaning_agents"),
        v.literal("other"),
      ),
    ),
    stockLevel: v.optional(
      v.union(
        v.literal("in_stock"),
        v.literal("low"),
        v.literal("out_of_stock"),
      ),
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    let results;

    if (args.categoryType) {
      // Use compound index for category-scoped queries
      results = await ctx.db
        .query("consumables")
        .withIndex("by_org_and_category", (q) =>
          q
            .eq("organizationId", organizationId)
            .eq("categoryType", args.categoryType!),
        )
        .paginate(args.paginationOpts);
    } else {
      // All consumables in org
      results = await ctx.db
        .query("consumables")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .paginate(args.paginationOpts);
    }

    // Apply stock level filter post-pagination
    if (args.stockLevel) {
      results = {
        ...results,
        page: results.page.filter((c) => {
          if (args.stockLevel === "out_of_stock") return c.currentStock === 0;
          if (args.stockLevel === "low")
            return c.currentStock > 0 && c.currentStock <= c.reorderPoint;
          // in_stock: currentStock > reorderPoint
          return c.currentStock > c.reorderPoint;
        }),
      };
    }

    // Apply search filter post-pagination (both Vietnamese and English names)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      results = {
        ...results,
        page: results.page.filter(
          (c) =>
            c.nameVi.toLowerCase().includes(searchLower) ||
            c.nameEn.toLowerCase().includes(searchLower),
        ),
      };
    }

    return results;
  },
});

/**
 * Gets a single consumable by ID with its linked equipment joined.
 * Returns null if not found or if the consumable belongs to a different org.
 *
 * WHY: Returning null prevents information leakage about IDs in other orgs.
 *
 * vi: "Lấy vật tư theo ID" / en: "Get consumable by ID"
 */
export const getById = query({
  args: {
    id: v.id("consumables"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const consumable = await ctx.db.get(args.id);
    if (!consumable || consumable.organizationId !== organizationId) {
      return null;
    }

    const relatedEquipment = consumable.relatedEquipmentId
      ? await ctx.db.get(consumable.relatedEquipmentId)
      : null;

    return { ...consumable, relatedEquipment };
  },
});

/**
 * Returns all consumables where currentStock <= reorderPoint for the org.
 * Used for low-stock alerts and dashboard widget.
 *
 * vi: "Vật tư sắp hết hàng" / en: "Low stock consumables"
 */
export const getLowStock = query({
  args: {},
  handler: async (ctx, _args) => {
    const { organizationId } = await requireAuth(ctx);

    const allConsumables = await ctx.db
      .query("consumables")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Low stock: currentStock <= reorderPoint (includes out-of-stock)
    return allConsumables.filter((c) => c.currentStock <= c.reorderPoint);
  },
});

/**
 * Returns paginated usage log for a consumable, descending by createdAt.
 *
 * vi: "Nhật ký sử dụng vật tư" / en: "Consumable usage log"
 */
export const getUsageLog = query({
  args: {
    consumableId: v.id("consumables"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    // Verify consumable belongs to this org
    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("consumableUsageLog")
      .withIndex("by_consumable", (q) =>
        q.eq("consumableId", args.consumableId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Returns reorder requests for the organization, optionally filtered by status.
 *
 * vi: "Danh sách yêu cầu đặt hàng lại" / en: "Reorder requests list"
 */
export const getReorderRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("ordered"),
        v.literal("received"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const requests = await ctx.db
      .query("reorderRequests")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    if (args.status) {
      return requests.filter((r) => r.status === args.status);
    }

    return requests;
  },
});

// ---------------------------------------------------------------------------
// Helper: validate numeric fields for consumable create/update
// vi: "Kiểm tra giá trị số cho vật tư" / en: "Validate numeric fields"
// ---------------------------------------------------------------------------

function validateConsumableNumericFields(args: {
  currentStock?: number;
  reorderPoint?: number;
  parLevel?: number;
  maxLevel?: number;
  unitCost?: number;
}) {
  if (args.currentStock !== undefined && args.currentStock < 0)
    throw new ConvexError({
      vi: "Tồn kho không thể âm",
      en: "Stock cannot be negative",
    });
  if (args.reorderPoint !== undefined && args.reorderPoint < 0)
    throw new ConvexError({
      vi: "Điểm đặt hàng lại không thể âm",
      en: "Reorder point cannot be negative",
    });
  if (args.unitCost !== undefined && args.unitCost < 0)
    throw new ConvexError({
      vi: "Đơn giá không thể âm",
      en: "Unit cost cannot be negative",
    });
  if (
    args.parLevel !== undefined &&
    args.reorderPoint !== undefined &&
    args.parLevel < args.reorderPoint
  )
    throw new ConvexError({
      vi: "Mức par phải ≥ điểm đặt hàng lại",
      en: "Par level must be >= reorder point",
    });
  if (
    args.maxLevel !== undefined &&
    args.parLevel !== undefined &&
    args.maxLevel < args.parLevel
  )
    throw new ConvexError({
      vi: "Mức tối đa phải ≥ mức par",
      en: "Max level must be >= par level",
    });
}

// ===========================================================================
// MUTATIONS (Write)
// vi: "Đột biến (ghi)" / en: "Mutations (write)"
// ===========================================================================

/**
 * Creates a new consumable in the organization.
 * Validates relatedEquipmentId if provided (must belong to same org).
 *
 * vi: "Tạo vật tư tiêu hao mới" / en: "Create new consumable"
 */
export const create = mutation({
  args: {
    nameVi: v.string(),
    nameEn: v.string(),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    sku: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    unitOfMeasure: v.string(),
    categoryType: v.union(
      v.literal("disposables"),
      v.literal("reagents"),
      v.literal("electrodes"),
      v.literal("filters"),
      v.literal("lubricants"),
      v.literal("cleaning_agents"),
      v.literal("other"),
    ),
    currentStock: v.number(),
    parLevel: v.number(),
    maxLevel: v.optional(v.number()),
    reorderPoint: v.number(),
    unitCost: v.optional(v.number()),
    relatedEquipmentId: v.optional(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    validateConsumableNumericFields(args);
    const { organizationId } = await requireAuth(ctx);

    // Validate relatedEquipmentId belongs to same org
    if (args.relatedEquipmentId) {
      const equipment = await ctx.db.get(args.relatedEquipmentId);
      if (!equipment || equipment.organizationId !== organizationId) {
        throw new ConvexError(
          "Thiết bị liên kết không tồn tại hoặc không thuộc tổ chức này (Related equipment not found or does not belong to this organization)",
        );
      }
    }

    const now = Date.now();
    const consumableId = await ctx.db.insert("consumables", {
      organizationId,
      nameVi: args.nameVi,
      nameEn: args.nameEn,
      descriptionVi: args.descriptionVi,
      descriptionEn: args.descriptionEn,
      sku: args.sku,
      manufacturer: args.manufacturer,
      unitOfMeasure: args.unitOfMeasure,
      categoryType: args.categoryType,
      currentStock: args.currentStock,
      parLevel: args.parLevel,
      maxLevel: args.maxLevel,
      reorderPoint: args.reorderPoint,
      unitCost: args.unitCost,
      relatedEquipmentId: args.relatedEquipmentId,
      createdAt: now,
      updatedAt: now,
    });

    return consumableId;
  },
});

/**
 * Updates non-stock fields of a consumable. Refreshes updatedAt.
 * Does NOT allow stock changes — use recordUsage, receiveStock, or adjustStock.
 *
 * WHY: Keeping stock changes as separate mutations ensures every stock movement
 * creates an audit trail in consumableUsageLog.
 *
 * vi: "Cập nhật thông tin vật tư tiêu hao" / en: "Update consumable info"
 */
export const update = mutation({
  args: {
    id: v.id("consumables"),
    nameVi: v.optional(v.string()),
    nameEn: v.optional(v.string()),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    sku: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    unitOfMeasure: v.optional(v.string()),
    categoryType: v.optional(
      v.union(
        v.literal("disposables"),
        v.literal("reagents"),
        v.literal("electrodes"),
        v.literal("filters"),
        v.literal("lubricants"),
        v.literal("cleaning_agents"),
        v.literal("other"),
      ),
    ),
    parLevel: v.optional(v.number()),
    maxLevel: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
    unitCost: v.optional(v.number()),
    relatedEquipmentId: v.optional(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    validateConsumableNumericFields(args);
    const { organizationId } = await requireAuth(ctx);

    const consumable = await ctx.db.get(args.id);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Records usage: ATOMICALLY decreases currentStock and inserts a USAGE log entry.
 * Rejects if usage would result in negative stock.
 *
 * WHY: Atomic stock decrease + log ensures no usage goes untracked,
 * and prevents stock from going negative (impossible physical state).
 *
 * vi: "Ghi nhận sử dụng vật tư (giảm tồn kho)" / en: "Record consumable usage (decrease stock)"
 */
export const recordUsage = mutation({
  args: {
    consumableId: v.id("consumables"),
    quantity: v.number(),
    usedBy: v.id("users"),
    equipmentId: v.optional(v.id("equipment")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);
    await checkOrgRateLimit(ctx, organizationId, "consumables.recordUsage");

    // FIX 5: Reject non-positive quantity
    if (args.quantity <= 0) {
      throw new ConvexError(
        "Số lượng phải lớn hơn 0 (Quantity must be greater than 0)",
      );
    }

    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    // Reject if would result in negative stock
    if (consumable.currentStock - args.quantity < 0) {
      throw new ConvexError(
        `Tồn kho không đủ: hiện có ${consumable.currentStock}, cần ${args.quantity} (Insufficient stock: current ${consumable.currentStock}, requested ${args.quantity})`,
      );
    }

    const now = Date.now();

    // ATOMIC: decrease stock + log usage
    await ctx.db.patch(args.consumableId, {
      currentStock: consumable.currentStock - args.quantity,
      updatedAt: now,
    });

    await ctx.db.insert("consumableUsageLog", {
      consumableId: args.consumableId,
      quantity: args.quantity,
      transactionType: "USAGE",
      usedBy: args.usedBy,
      equipmentId: args.equipmentId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Receives stock: ATOMICALLY increases currentStock and inserts a RECEIVE log entry.
 *
 * vi: "Nhận hàng (tăng tồn kho)" / en: "Receive stock (increase stock)"
 */
export const receiveStock = mutation({
  args: {
    consumableId: v.id("consumables"),
    quantity: v.number(),
    usedBy: v.id("users"),
    equipmentId: v.optional(v.id("equipment")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    // FIX 5: Reject non-positive quantity
    if (args.quantity <= 0) {
      throw new ConvexError(
        "Số lượng nhận phải lớn hơn 0 (Received quantity must be greater than 0)",
      );
    }

    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    const now = Date.now();

    // ATOMIC: increase stock + log receipt
    await ctx.db.patch(args.consumableId, {
      currentStock: consumable.currentStock + args.quantity,
      updatedAt: now,
    });

    await ctx.db.insert("consumableUsageLog", {
      consumableId: args.consumableId,
      quantity: args.quantity,
      transactionType: "RECEIVE",
      usedBy: args.usedBy,
      equipmentId: args.equipmentId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Adjusts stock by a delta (positive or negative) and logs an ADJUSTMENT entry.
 * Used for inventory corrections (found extra stock, waste disposal, etc.).
 *
 * vi: "Điều chỉnh tồn kho" / en: "Adjust stock"
 */
export const adjustStock = mutation({
  args: {
    consumableId: v.id("consumables"),
    delta: v.number(),
    usedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    const newStock = consumable.currentStock + args.delta;
    if (newStock < 0) {
      throw new ConvexError(
        `Điều chỉnh sẽ làm tồn kho âm (Adjustment would result in negative stock: ${newStock})`,
      );
    }

    const now = Date.now();

    // ATOMIC: adjust stock + log adjustment
    await ctx.db.patch(args.consumableId, {
      currentStock: newStock,
      updatedAt: now,
    });

    await ctx.db.insert("consumableUsageLog", {
      consumableId: args.consumableId,
      quantity: Math.abs(args.delta),
      transactionType: "ADJUSTMENT",
      usedBy: args.usedBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Creates a reorder request with pending status.
 * Links to the consumable and scopes to the organization.
 *
 * vi: "Tạo yêu cầu đặt hàng lại" / en: "Create reorder request"
 */
export const createReorderRequest = mutation({
  args: {
    consumableId: v.id("consumables"),
    quantity: v.number(),
    requestedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    // FIX 5: Reject non-positive quantity
    if (args.quantity <= 0) {
      throw new ConvexError(
        "Số lượng đặt hàng phải lớn hơn 0 (Order quantity must be greater than 0)",
      );
    }

    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("reorderRequests", {
      consumableId: args.consumableId,
      organizationId,
      quantity: args.quantity,
      status: "pending",
      requestedBy: args.requestedBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return requestId;
  },
});

/**
 * Updates the status of a reorder request.
 * When status transitions to "received", automatically receives the stock
 * by increasing currentStock and creating a RECEIVE usage log entry.
 *
 * vi: "Cập nhật trạng thái yêu cầu đặt hàng lại" / en: "Update reorder request status"
 */
export const updateReorderStatus = mutation({
  args: {
    id: v.id("reorderRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("ordered"),
      v.literal("received"),
      v.literal("cancelled"),
    ),
    approvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const request = await ctx.db.get(args.id);
    if (!request || request.organizationId !== organizationId) {
      throw new ConvexError(
        "Yêu cầu đặt hàng không tồn tại hoặc không thuộc tổ chức này (Reorder request not found or does not belong to this organization)",
      );
    }

    const now = Date.now();

    // Update request status
    await ctx.db.patch(args.id, {
      status: args.status,
      approvedBy: args.approvedBy,
      notes: args.notes ?? request.notes,
      updatedAt: now,
    });

    // Auto-receive stock when status transitions to "received"
    if (args.status === "received") {
      // FIX 3: Idempotency guard — prevent double-receiving stock
      if (request.status === "received") {
        throw new ConvexError(
          "Yêu cầu đặt hàng đã được nhận (Reorder request already received)",
        );
      }

      const consumable = await ctx.db.get(request.consumableId);
      // FIX 4: Explicit error when consumable doesn't exist (instead of silent skip)
      if (!consumable) {
        throw new ConvexError("Vật tư không tồn tại (Consumable not found)");
      }

      // ATOMIC: increase stock + log receipt
      await ctx.db.patch(request.consumableId, {
        currentStock: consumable.currentStock + request.quantity,
        updatedAt: now,
      });

      const performedBy = args.approvedBy ?? request.requestedBy;
      await ctx.db.insert("consumableUsageLog", {
        consumableId: request.consumableId,
        quantity: request.quantity,
        transactionType: "RECEIVE",
        usedBy: performedBy,
        notes: `Nhận hàng từ yêu cầu đặt hàng lại (Received from reorder request)`,
        createdAt: now,
        updatedAt: now,
      });
    }

    return args.id;
  },
});
