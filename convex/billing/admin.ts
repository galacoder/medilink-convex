/**
 * Admin subscription management functions.
 *
 * Platform admins can view all organizations, activate/extend/suspend
 * subscriptions, and manage the subscription lifecycle.
 *
 * WHY: All admin subscription management operations are centralized here
 * for consistent auth enforcement and audit logging.
 *
 * vi: "Quan ly dang ky — Quan tri vien nen tang"
 * en: "Subscription management — Platform admin"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
import { ConvexError, v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { PLAN_MONTHLY_CREDITS } from "./creditCosts";

// ---------------------------------------------------------------------------
// Plan limits reference
// ---------------------------------------------------------------------------

/** Max staff seats per plan: starter=10, professional=50, enterprise=-1 (unlimited) */
const PLAN_MAX_STAFF: Record<string, number> = {
  starter: 10,
  professional: 50,
  enterprise: -1,
};

/** Max equipment per plan: starter=100, professional=-1, enterprise=-1 */
const PLAN_MAX_EQUIPMENT: Record<string, number> = {
  starter: 100,
  professional: -1,
  enterprise: -1,
};

/** Billing cycle duration in milliseconds */
const BILLING_CYCLE_MS: Record<string, number> = {
  monthly_3: 3 * 30 * 24 * 60 * 60 * 1000,
  monthly_6: 6 * 30 * 24 * 60 * 60 * 1000,
  monthly_12: 12 * 30 * 24 * 60 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

interface PlatformAuthContext {
  userId: string;
  platformRole: string | null;
}

/**
 * Extracts and validates auth identity from JWT.
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
 * Falls back to custom `users` table when JWT lacks platformRole.
 *
 * vi: "Yeu cau quyen quan tri vien nen tang"
 * en: "Require platform admin role"
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

  // JWT fallback: look up platformRole from custom `users` table
  if (auth.email) {
    const user = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ===========================================================================
// QUERIES
// ===========================================================================

/**
 * List all hospital organizations with subscription status.
 * Supports filter by status and search by name.
 *
 * vi: "Danh sach to chuc va dang ky" / en: "List organizations with subscriptions"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const listOrganizationSubscriptions = query({
  args: {
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("active"),
        v.literal("trial"),
        v.literal("grace_period"),
        v.literal("expired"),
        v.literal("suspended"),
      ),
    ),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    await requirePlatformAdmin(ctx);

    // Fetch all hospital orgs
    let orgs = await ctx.db
      .query("organizations")
      .withIndex("by_type", (q) => q.eq("org_type", "hospital"))
      .collect();

    // Filter by status if provided and not "all"
    if (args.statusFilter && args.statusFilter !== "all") {
      orgs = orgs.filter((org) => {
        const orgStatus = org.status ?? "active";
        return orgStatus === args.statusFilter;
      });
    }

    // Filter by name search (case-insensitive)
    if (args.searchQuery) {
      const searchLower = args.searchQuery.toLowerCase();
      orgs = orgs.filter((org) => org.name.toLowerCase().includes(searchLower));
    }

    const total = orgs.length;

    // Sort by most recent first
    const sortedOrgs = orgs.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with staff/equipment counts
    const organizations = await Promise.all(
      sortedOrgs.map(async (org) => {
        const [memberships, equipment] = await Promise.all([
          ctx.db
            .query("organizationMemberships")
            .withIndex("by_org", (q) => q.eq("orgId", org._id))
            .collect(),
          ctx.db
            .query("equipment")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect(),
        ]);

        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          status: (org.status ?? "active") as
            | "active"
            | "trial"
            | "grace_period"
            | "expired"
            | "suspended",
          subscriptionPlan: org.subscriptionPlan ?? null,
          billingCycle: org.billingCycle ?? null,
          subscriptionExpiresAt: org.subscriptionExpiresAt ?? null,
          gracePeriodEndsAt: org.gracePeriodEndsAt ?? null,
          maxStaffSeats: org.maxStaffSeats ?? null,
          maxEquipment: org.maxEquipment ?? null,
          staffCount: memberships.length,
          equipmentCount: equipment.length,
          createdAt: org.createdAt,
        };
      }),
    );

    return { organizations, total };
  },
});

/**
 * Get full billing detail for an organization.
 *
 * vi: "Chi tiet thanh toan to chuc" / en: "Organization billing detail"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const getOrganizationBillingDetail = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.organizationId);
    if (!org) return null;

    // Staff count
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.organizationId))
      .collect();

    // Equipment count
    const equipment = await ctx.db
      .query("equipment")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Subscription history (all subscriptions for this org, sorted by date desc)
    const subscriptionHistory = await ctx.db
      .query("subscriptions")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
    subscriptionHistory.sort((a, b) => b.createdAt - a.createdAt);

    // Payment history
    const paymentHistory = await ctx.db
      .query("payments")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
    paymentHistory.sort((a, b) => b.createdAt - a.createdAt);

    // AI credits
    const aiCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    return {
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        status: (org.status ?? "active") as string,
        subscriptionPlan: org.subscriptionPlan ?? null,
        billingCycle: org.billingCycle ?? null,
        subscriptionStartDate: org.subscriptionStartDate ?? null,
        subscriptionExpiresAt: org.subscriptionExpiresAt ?? null,
        gracePeriodEndsAt: org.gracePeriodEndsAt ?? null,
        maxStaffSeats: org.maxStaffSeats ?? null,
        maxEquipment: org.maxEquipment ?? null,
        createdAt: org.createdAt,
      },
      staffCount: memberships.length,
      equipmentCount: equipment.length,
      subscriptionHistory: subscriptionHistory.map((sub) => ({
        _id: sub._id,
        plan: sub.plan,
        billingCycle: sub.billingCycle,
        startDate: sub.startDate,
        endDate: sub.endDate,
        amountVnd: sub.amountVnd,
        status: sub.status,
        monthlyAiCredits: sub.monthlyAiCredits,
        activatedBy: sub.activatedBy ?? null,
        activatedAt: sub.activatedAt ?? null,
        notes: sub.notes ?? null,
        createdAt: sub.createdAt,
      })),
      paymentHistory: paymentHistory.map((p) => ({
        _id: p._id,
        amountVnd: p.amountVnd,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paymentType: p.paymentType,
        bankReference: p.bankReference ?? null,
        confirmedAt: p.confirmedAt ?? null,
        notes: p.notes ?? null,
        createdAt: p.createdAt,
      })),
      aiCredits: aiCredits
        ? {
            balance: aiCredits.balance,
            monthlyIncluded: aiCredits.monthlyIncluded,
            monthlyUsed: aiCredits.monthlyUsed,
            bonusCredits: aiCredits.bonusCredits ?? 0,
            monthlyResetAt: aiCredits.monthlyResetAt,
          }
        : null,
    };
  },
});

// ===========================================================================
// MUTATIONS
// ===========================================================================

/**
 * Activate a subscription for an organization.
 *
 * Creates subscription record, updates org with plan limits, initializes AI credits.
 *
 * vi: "Kich hoat dang ky" / en: "Activate subscription"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const activateSubscription = mutation({
  args: {
    organizationId: v.id("organizations"),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise"),
    ),
    billingCycle: v.union(
      v.literal("monthly_3"),
      v.literal("monthly_6"),
      v.literal("monthly_12"),
    ),
    paymentId: v.id("payments"),
    amountVnd: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await requirePlatformAdmin(ctx);

    // 1. Verify org exists
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "ORG_NOT_FOUND",
        message: "Khong tim thay to chuc (Organization not found)",
        messageVi: "Khong tim thay to chuc",
      });
    }

    // 2. Verify payment exists and is confirmed
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
        code: "PAYMENT_NOT_CONFIRMED",
        message:
          "Thanh toan chua duoc xac nhan (Payment must be confirmed before activation)",
        messageVi: "Thanh toan chua duoc xac nhan",
      });
    }

    // 3. Calculate subscription period
    const now = Date.now();
    const durationMs = BILLING_CYCLE_MS[args.billingCycle]!;
    const startDate = now;
    const endDate = now + durationMs;

    // 4. Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      organizationId: args.organizationId,
      plan: args.plan,
      billingCycle: args.billingCycle,
      startDate,
      endDate,
      amountVnd: args.amountVnd,
      paymentId: args.paymentId,
      status: "active",
      monthlyAiCredits: PLAN_MONTHLY_CREDITS[args.plan] ?? 50,
      activatedBy: auth.userId as any,
      activatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Update organization
    await ctx.db.patch(args.organizationId, {
      status: "active",
      subscriptionPlan: args.plan,
      billingCycle: args.billingCycle,
      subscriptionStartDate: startDate,
      subscriptionExpiresAt: endDate,
      maxStaffSeats: PLAN_MAX_STAFF[args.plan] ?? 10,
      maxEquipment: PLAN_MAX_EQUIPMENT[args.plan] ?? 100,
      gracePeriodEndsAt: undefined,
      updatedAt: now,
    });

    // 6. Initialize or update AI credits
    const monthlyCredits = PLAN_MONTHLY_CREDITS[args.plan] ?? 50;
    const existingCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    // Calculate next month's reset date (1st of next month UTC)
    const nowDate = new Date(now);
    const nextMonth = new Date(
      Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() + 1, 1, 0, 0, 0),
    );

    if (existingCredits) {
      await ctx.db.patch(existingCredits._id, {
        balance: monthlyCredits,
        monthlyIncluded: monthlyCredits,
        monthlyUsed: 0,
        monthlyResetAt: nextMonth.getTime(),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("aiCredits", {
        organizationId: args.organizationId,
        balance: monthlyCredits,
        lifetimeCreditsGranted: monthlyCredits,
        lifetimeCreditsUsed: 0,
        monthlyIncluded: monthlyCredits,
        monthlyUsed: 0,
        monthlyResetAt: nextMonth.getTime(),
        updatedAt: now,
      });
    }

    // 7. Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.organizationId,
      actorId: auth.userId as any,
      action: "billing.subscription_activated",
      resourceType: "subscription",
      resourceId: subscriptionId,
      previousValues: { status: org.status ?? "trial" },
      newValues: {
        plan: args.plan,
        billingCycle: args.billingCycle,
        amountVnd: args.amountVnd,
        status: "active",
      },
      createdAt: now,
      updatedAt: now,
    });

    return { subscriptionId };
  },
});

/**
 * Extend an existing subscription.
 *
 * KEY RULE: Extension adds time from CURRENT expiresAt, not from today.
 * Early renewal adds to existing end date (no penalty).
 *
 * vi: "Gia han dang ky" / en: "Extend subscription"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const extendSubscription = mutation({
  args: {
    organizationId: v.id("organizations"),
    billingCycle: v.union(
      v.literal("monthly_3"),
      v.literal("monthly_6"),
      v.literal("monthly_12"),
    ),
    paymentId: v.id("payments"),
    amountVnd: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await requirePlatformAdmin(ctx);

    // 1. Verify org exists
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "ORG_NOT_FOUND",
        message: "Khong tim thay to chuc (Organization not found)",
        messageVi: "Khong tim thay to chuc",
      });
    }

    // 2. Verify payment is confirmed
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.status !== "confirmed") {
      throw new ConvexError({
        code: "PAYMENT_NOT_CONFIRMED",
        message:
          "Thanh toan chua duoc xac nhan (Payment must be confirmed before extension)",
        messageVi: "Thanh toan chua duoc xac nhan",
      });
    }

    const now = Date.now();
    const durationMs = BILLING_CYCLE_MS[args.billingCycle]!;

    // 3. Calculate new expiresAt from CURRENT expiresAt (not from today)
    // KEY RULE: Early renewal adds to existing end date
    const currentExpiresAt = org.subscriptionExpiresAt ?? now;
    const baseDate = Math.max(currentExpiresAt, now); // If expired, start from now
    const newEndDate = baseDate + durationMs;

    // 4. Mark current active subscription as "renewed"
    const currentSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_organizationId_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "active"),
      )
      .first();

    if (currentSub) {
      await ctx.db.patch(currentSub._id, {
        status: "renewed",
        updatedAt: now,
      });
    }

    // Also check for expired subscriptions (in case of grace_period renewal)
    if (!currentSub) {
      const expiredSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_organizationId_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", "expired"),
        )
        .first();

      if (expiredSub) {
        await ctx.db.patch(expiredSub._id, {
          status: "renewed",
          updatedAt: now,
        });
      }
    }

    // 5. Create new subscription record
    const plan = org.subscriptionPlan ?? "starter";
    const subscriptionId = await ctx.db.insert("subscriptions", {
      organizationId: args.organizationId,
      plan: plan as "starter" | "professional" | "enterprise" | "trial",
      billingCycle: args.billingCycle,
      startDate: now,
      endDate: newEndDate,
      amountVnd: args.amountVnd,
      paymentId: args.paymentId,
      status: "active",
      monthlyAiCredits: PLAN_MONTHLY_CREDITS[plan] ?? 50,
      activatedBy: auth.userId as any,
      activatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Update organization
    await ctx.db.patch(args.organizationId, {
      status: "active",
      billingCycle: args.billingCycle,
      subscriptionExpiresAt: newEndDate,
      gracePeriodEndsAt: undefined,
      updatedAt: now,
    });

    // 7. Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.organizationId,
      actorId: auth.userId as any,
      action: "billing.subscription_extended",
      resourceType: "subscription",
      resourceId: subscriptionId,
      previousValues: {
        status: org.status ?? "active",
        expiresAt: org.subscriptionExpiresAt,
      },
      newValues: {
        billingCycle: args.billingCycle,
        newExpiresAt: newEndDate,
        amountVnd: args.amountVnd,
        status: "active",
      },
      createdAt: now,
      updatedAt: now,
    });

    return { subscriptionId, newExpiresAt: newEndDate };
  },
});

/**
 * Suspend an organization's subscription.
 *
 * vi: "Tam ngung dang ky" / en: "Suspend subscription"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const suspendSubscription = mutation({
  args: {
    organizationId: v.id("organizations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "ORG_NOT_FOUND",
        message: "Khong tim thay to chuc (Organization not found)",
        messageVi: "Khong tim thay to chuc",
      });
    }

    const previousStatus = org.status ?? "active";
    const now = Date.now();

    // Update org status to suspended
    await ctx.db.patch(args.organizationId, {
      status: "suspended",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.organizationId,
      actorId: auth.userId as any,
      action: "billing.subscription_suspended",
      resourceType: "organization",
      resourceId: args.organizationId,
      previousValues: { status: previousStatus },
      newValues: {
        status: "suspended",
        reason: args.reason ?? "No reason provided",
      },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Reactivate a suspended or grace_period organization.
 *
 * Only works if the org has a valid (non-expired) subscription period,
 * OR if it's in grace_period (grace hasn't ended yet).
 *
 * vi: "Kich hoat lai dang ky" / en: "Reactivate subscription"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const reactivateSubscription = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "ORG_NOT_FOUND",
        message: "Khong tim thay to chuc (Organization not found)",
        messageVi: "Khong tim thay to chuc",
      });
    }

    const now = Date.now();
    const previousStatus = org.status ?? "active";

    // Check for valid subscription period
    // For suspended orgs: subscriptionExpiresAt must be in the future
    // For grace_period orgs: gracePeriodEndsAt must be in the future
    const hasValidSubscription =
      org.subscriptionExpiresAt != null && org.subscriptionExpiresAt > now;
    const hasValidGracePeriod =
      org.gracePeriodEndsAt != null && org.gracePeriodEndsAt > now;

    if (!hasValidSubscription && !hasValidGracePeriod) {
      throw new ConvexError({
        code: "SUBSCRIPTION_EXPIRED",
        message:
          "Dang ky da het han. Vui long kich hoat lai voi thanh toan moi. (Subscription expired. Please activate with new payment.)",
        messageVi:
          "Dang ky da het han. Vui long kich hoat lai voi thanh toan moi.",
      });
    }

    // Update org status to active
    await ctx.db.patch(args.organizationId, {
      status: "active",
      gracePeriodEndsAt: undefined,
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.organizationId,
      actorId: auth.userId as any,
      action: "billing.subscription_reactivated",
      resourceType: "organization",
      resourceId: args.organizationId,
      previousValues: { status: previousStatus },
      newValues: { status: "active" },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
