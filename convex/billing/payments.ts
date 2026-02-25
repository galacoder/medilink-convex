/**
 * Payment record management: record, confirm, reject, void, list, detail.
 *
 * WHY: In Phase 1 (manual billing), every payment is a bank transfer that
 * an admin manually records and confirms before activating a subscription.
 * This module provides full CRUD + status transition logic for payments.
 *
 * vi: "Quan ly ban ghi thanh toan" / en: "Payment record management"
 *
 * Auth: All functions require platformRole === "platform_admin".
 * Uses local JWT auth helper (same pattern as admin/hospitals.ts).
 *
 * @see Issue #173 -- M1-4: Payment Record Management
 */

import { ConvexError, v } from "convex/values";

import { mutation, query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

interface PlatformAuthContext {
  userId: string;
  platformRole: string | null;
}

/**
 * Extracts auth context from JWT identity.
 * Throws bilingual ConvexError if not authenticated.
 *
 * vi: "Xac thuc nguoi dung" / en: "Authenticate user"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<PlatformAuthContext & { email: string | null }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xac thuc that bai. Vui long dang nhap lai. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }
  return {
    userId: identity.subject as string,
    email: (identity.email as string | null) ?? null,
    platformRole: (identity.platformRole as string | null) ?? null,
  };
}

/**
 * Asserts the caller has platformRole === "platform_admin".
 * Falls back to the custom `users` table when JWT lacks platformRole.
 *
 * vi: "Yeu cau quyen quan tri vien nen tang" / en: "Require platform admin role"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<PlatformAuthContext> {
  const auth = await localRequireAuth(ctx);

  if (auth.platformRole === "platform_admin") {
    return auth;
  }

  // JWT fallback: look up from custom `users` table
  if (auth.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", auth.email))
      .first();
    if (user?.platformRole === "platform_admin") {
      return { userId: auth.userId, platformRole: "platform_admin" };
    }
  }

  throw new ConvexError({
    code: "FORBIDDEN",
    // vi: "Chi quan tri vien nen tang moi co quyen truy cap"
    // en: "Only platform admins can access this resource"
    message:
      "Chi quan tri vien nen tang moi co quyen truy cap (Only platform admins can access this resource)",
  });
}

// ---------------------------------------------------------------------------
// Invoice number generation
// ---------------------------------------------------------------------------

/**
 * Auto-generate invoice number in ML-YYYYMMDD-XXXX format.
 *
 * vi: "Tao so hoa don tu dong" / en: "Auto-generate invoice number"
 */
function generateInvoiceNumber(existingCount: number): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(existingCount + 1).padStart(4, "0");
  return `ML-${dateStr}-${seq}`;
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

/**
 * Record a new payment. Creates in pending state by default, or confirmed
 * immediately if confirmImmediately is true.
 *
 * vi: "Ghi nhan thanh toan moi" / en: "Record new payment"
 */
export const recordPayment = mutation({
  args: {
    organizationId: v.id("organizations"),
    amountVnd: v.number(),
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("cash"),
      v.literal("momo"),
      v.literal("vnpay"),
      v.literal("other"),
    ),
    paymentType: v.union(
      v.literal("subscription_new"),
      v.literal("subscription_renewal"),
      v.literal("ai_credits"),
      v.literal("upgrade"),
      v.literal("other"),
    ),
    bankReference: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transferDate: v.optional(v.number()),
    invoiceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    confirmImmediately: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Verify caller is platform admin
    const admin = await requirePlatformAdmin(ctx);

    // 2. Validate organization exists
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "ORG_NOT_FOUND",
        message: "Khong tim thay to chuc (Organization not found)",
        messageVi: "Khong tim thay to chuc",
      });
    }

    // 3. Auto-generate invoice number if not provided
    let invoiceNumber = args.invoiceNumber;
    if (!invoiceNumber) {
      // Count existing payments to determine sequence
      const existingPayments = await ctx.db.query("payments").collect();
      invoiceNumber = generateInvoiceNumber(existingPayments.length);
    }

    // 4. Determine initial status
    const isConfirmed = args.confirmImmediately === true;
    const now = Date.now();

    // 5. Find admin user ID from users table for confirmedBy
    let adminUserId: string | undefined;
    if (isConfirmed && admin.userId) {
      // Look up user record by email or token identifier
      const identity = await ctx.auth.getUserIdentity();
      const email = identity?.email as string | undefined;
      if (email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .first();
        if (user) {
          adminUserId = user._id;
        }
      }
    }

    // 6. Create payment record
    const paymentId = await ctx.db.insert("payments", {
      organizationId: args.organizationId,
      amountVnd: args.amountVnd,
      paymentMethod: args.paymentMethod,
      paymentType: args.paymentType,
      bankReference: args.bankReference,
      bankName: args.bankName,
      transferDate: args.transferDate,
      invoiceNumber,
      notes: args.notes,
      status: isConfirmed ? "confirmed" : "pending",
      confirmedBy: isConfirmed ? (adminUserId as any) : undefined,
      confirmedAt: isConfirmed ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

/**
 * Confirm a pending payment. Transitions pending -> confirmed.
 *
 * vi: "Xac nhan thanh toan" / en: "Confirm payment"
 */
export const confirmPayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    // 1. Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    // 2. Verify payment exists and status is pending
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new ConvexError({
        code: "PAYMENT_NOT_FOUND",
        message: "Khong tim thay thanh toan (Payment not found)",
        messageVi: "Khong tim thay thanh toan",
      });
    }

    if (payment.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATUS_TRANSITION",
        message:
          "Chi co the xac nhan thanh toan dang cho (Can only confirm pending payments)",
        messageVi: "Chi co the xac nhan thanh toan dang cho",
      });
    }

    // 3. Find admin user ID for confirmedBy
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email as string | undefined;
    let adminUserId: string | undefined;
    if (email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q: any) => q.eq("email", email))
        .first();
      if (user) {
        adminUserId = user._id;
      }
    }

    const now = Date.now();

    // 4. Update payment
    await ctx.db.patch(args.paymentId, {
      status: "confirmed",
      confirmedBy: (adminUserId as any) ?? undefined,
      confirmedAt: now,
      updatedAt: now,
    });

    return args.paymentId;
  },
});

/**
 * Reject a pending payment. Transitions pending -> rejected with reason.
 *
 * vi: "Tu choi thanh toan" / en: "Reject payment"
 */
export const rejectPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    // 2. Verify payment exists and status is pending
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new ConvexError({
        code: "PAYMENT_NOT_FOUND",
        message: "Khong tim thay thanh toan (Payment not found)",
        messageVi: "Khong tim thay thanh toan",
      });
    }

    if (payment.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATUS_TRANSITION",
        message:
          "Chi co the tu choi thanh toan dang cho (Can only reject pending payments)",
        messageVi: "Chi co the tu choi thanh toan dang cho",
      });
    }

    // 3. Update payment
    await ctx.db.patch(args.paymentId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      updatedAt: Date.now(),
    });

    return args.paymentId;
  },
});

/**
 * Void a confirmed payment. Transitions confirmed -> refunded with reason.
 * WARNING: Does NOT automatically void linked subscription --
 * admin must separately handle subscription status.
 *
 * vi: "Huy thanh toan" / en: "Void payment"
 */
export const voidPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    // 2. Verify payment exists and status is confirmed
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new ConvexError({
        code: "PAYMENT_NOT_FOUND",
        message: "Khong tim thay thanh toan (Payment not found)",
        messageVi: "Khong tim thay thanh toan",
      });
    }

    if (payment.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_STATUS_TRANSITION",
        message:
          "Chi co the huy thanh toan da xac nhan (Can only void confirmed payments)",
        messageVi: "Chi co the huy thanh toan da xac nhan",
      });
    }

    // 3. Update payment -- append void reason to notes
    const existingNotes = payment.notes ?? "";
    const voidNote = existingNotes
      ? `${existingNotes}\n[VOIDED] ${args.reason}`
      : `[VOIDED] ${args.reason}`;

    await ctx.db.patch(args.paymentId, {
      status: "refunded",
      notes: voidNote,
      updatedAt: Date.now(),
    });

    return args.paymentId;
  },
});

// ===========================================================================
// QUERIES
// ===========================================================================

/**
 * List all payments with optional filters for status, organization, and search.
 * Returns payments joined with organization name, sorted by createdAt desc.
 *
 * vi: "Danh sach thanh toan" / en: "List payments"
 */
export const listPayments = query({
  args: {
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("rejected"),
        v.literal("refunded"),
      ),
    ),
    organizationId: v.optional(v.id("organizations")),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    let payments;

    // Query based on filters
    if (
      args.organizationId &&
      args.statusFilter &&
      args.statusFilter !== "all"
    ) {
      // Filter by both org and status
      payments = await ctx.db
        .query("payments")
        .withIndex("by_organizationId_status", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("status", args.statusFilter),
        )
        .collect();
    } else if (args.organizationId) {
      // Filter by org only
      payments = await ctx.db
        .query("payments")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", args.organizationId),
        )
        .collect();
    } else if (args.statusFilter && args.statusFilter !== "all") {
      // Filter by status only
      payments = await ctx.db
        .query("payments")
        .withIndex("by_status", (q: any) => q.eq("status", args.statusFilter))
        .collect();
    } else {
      // No filter -- get all
      payments = await ctx.db.query("payments").collect();
    }

    // Join with organization names
    const paymentsWithOrg = await Promise.all(
      payments.map(async (payment) => {
        const org = await ctx.db.get(payment.organizationId);
        return {
          ...payment,
          organizationName: org?.name ?? "Unknown",
        };
      }),
    );

    // Apply search filter (org name or invoice number)
    let filtered = paymentsWithOrg;
    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      filtered = paymentsWithOrg.filter(
        (p) =>
          p.organizationName.toLowerCase().includes(search) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(search)),
      );
    }

    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    return {
      payments: filtered,
      total: filtered.length,
    };
  },
});

/**
 * Get full payment detail with organization name and linked subscription info.
 *
 * vi: "Chi tiet thanh toan" / en: "Payment detail"
 */
export const getPaymentDetail = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    // Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      return null;
    }

    // Join with organization
    const org = await ctx.db.get(payment.organizationId);

    // Join with subscription if linked
    let subscription = null;
    if (payment.subscriptionId) {
      subscription = await ctx.db.get(payment.subscriptionId);
    }

    // Join with confirming admin if applicable
    let confirmedByName: string | undefined;
    if (payment.confirmedBy) {
      const admin = await ctx.db.get(payment.confirmedBy);
      confirmedByName = admin?.name;
    }

    return {
      ...payment,
      organizationName: org?.name ?? "Unknown",
      subscription,
      confirmedByName,
    };
  },
});

/**
 * Get all payments for a specific organization, sorted by date descending.
 * Used by M1-3 subscription detail view.
 *
 * vi: "Lich su thanh toan theo to chuc" / en: "Organization payment history"
 */
export const getPaymentsByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Verify caller is platform admin
    await requirePlatformAdmin(ctx);

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .collect();

    return payments;
  },
});
