/**
 * Convex mutations and queries for payments (stub).
 *
 * WHY: Lightweight payment record stub for future Stripe/VNPay integration.
 * No payment processor integration yet — records payment intent only.
 * Provides the schema foundation for Wave 4 payment UI.
 *
 * State machine: pending -> completed | failed | refunded
 *
 * vi: "Thanh toán" / en: "Payments (stub)"
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

/**
 * Gets the authenticated user identity and extracts userId.
 * Throws a bilingual ConvexError if not authenticated.
 *
 * vi: "Xác thực người dùng" / en: "Authenticate user"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> | null }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }
  return {
    userId: identity.subject as string,
    organizationId: (identity.organizationId as Id<"organizations"> | null) ?? null,
  };
}

/**
 * Like localRequireAuth but also asserts an active organization session.
 *
 * vi: "Xác thực tổ chức" / en: "Require organization auth"
 */
async function localRequireOrgAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> }> {
  const auth = await localRequireAuth(ctx);
  if (!auth.organizationId) {
    throw new ConvexError({
      message:
        "Không tìm thấy tổ chức. Vui lòng chọn tổ chức trước khi thực hiện thao tác này. (Organization not found. Please select an organization before performing this action.)",
      code: "NO_ACTIVE_ORGANIZATION",
    });
  }
  return auth as { userId: string; organizationId: Id<"organizations"> };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Records a new payment intent.
 *
 * WHY: Stub for future payment processor integration. Creates a pending payment
 * record that can later be updated via webhook or manual confirmation.
 *
 * vi: "Tạo bản ghi thanh toán" / en: "Create payment record"
 */
export const create = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    serviceRequestId: v.optional(v.id("serviceRequests")),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    // 2. Validate amount
    if (args.amount <= 0) {
      throw new ConvexError({
        message:
          "Số tiền phải lớn hơn 0. (Amount must be greater than 0.)",
        code: "INVALID_AMOUNT",
      });
    }

    // 3. Insert payment record in pending status
    const now = Date.now();
    const paymentId = await ctx.db.insert("payment", {
      organizationId: auth.organizationId,
      paidBy: auth.userId as Id<"users">,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      descriptionVi: args.descriptionVi,
      descriptionEn: args.descriptionEn,
      serviceRequestId: args.serviceRequestId,
      method: args.method,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

/**
 * Lists payments for an organization.
 * Supports optional status filtering.
 * Returns payments sorted by creation time (newest first).
 *
 * vi: "Danh sách thanh toán của tổ chức" / en: "Organization payment list"
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    let payments;
    if (args.status) {
      payments = await ctx.db
        .query("payment")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", auth.organizationId).eq("status", args.status!),
        )
        .order("desc")
        .collect();
    } else {
      payments = await ctx.db
        .query("payment")
        .withIndex("by_org", (q) => q.eq("organizationId", auth.organizationId))
        .order("desc")
        .collect();
    }

    return payments;
  },
});

/**
 * Gets a single payment by ID.
 * Returns null if the payment is not found.
 *
 * vi: "Lấy thanh toán theo ID" / en: "Get payment by ID"
 */
export const getById = query({
  args: { paymentId: v.id("payment") },
  handler: async (ctx, args) => {
    // Authenticate with org context (required for ownership check)
    const auth = await localRequireOrgAuth(ctx);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      return null;
    }

    // Verify org ownership to prevent cross-org data leak.
    // WHY: Without this check any authenticated user can read payment records
    // from any organization by guessing IDs.
    if (payment.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền xem thanh toán này. (You do not have access to this payment.)",
        code: "FORBIDDEN",
      });
    }

    return payment;
  },
});

/**
 * Updates the status of a payment record.
 *
 * State machine: pending -> completed | failed | refunded
 * WHY: Only pending payments can change status. Completed/failed/refunded
 * are terminal states to preserve payment audit integrity.
 *
 * vi: "Cập nhật trạng thái thanh toán" / en: "Update payment status"
 */
export const updateStatus = mutation({
  args: {
    paymentId: v.id("payment"),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the payment
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new ConvexError({
        message: "Không tìm thấy thanh toán. (Payment not found.)",
        code: "PAYMENT_NOT_FOUND",
      });
    }

    // 3. Verify org ownership
    // WHY: Without this check any authenticated user can modify any payment
    // record — a CRITICAL cross-org write vulnerability.
    if (payment.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền cập nhật trạng thái thanh toán này. (You do not have access to update this payment.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine: only pending payments can be updated
    if (payment.status !== "pending") {
      throw new ConvexError({
        message: `Không thể cập nhật thanh toán ở trạng thái "${payment.status}". Chỉ thanh toán đang chờ mới có thể được cập nhật. (Cannot update payment in status "${payment.status}". Only pending payments can be updated.)`,
        code: "INVALID_TRANSITION",
        currentStatus: payment.status,
        targetStatus: args.status,
      });
    }

    // 5. Update payment status
    const now = Date.now();
    await ctx.db.patch(args.paymentId, {
      status: args.status,
      paidAt: args.status === "completed" ? (args.paidAt ?? now) : args.paidAt,
      updatedAt: now,
    });

    return args.paymentId;
  },
});
