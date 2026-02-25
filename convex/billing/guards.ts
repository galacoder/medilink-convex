/**
 * Subscription and AI credit guard middleware for Convex internal functions.
 *
 * WHY: Enforces subscription status and AI credit availability before
 * allowing mutations and AI feature access. Called by other Convex functions
 * to check if an organization has an active subscription and sufficient credits.
 *
 * vi: "Middleware kiem tra dang ky va credit AI"
 * en: "Subscription and AI credit guard middleware"
 *
 * @see context.md Section 1 (requireActiveSubscription)
 * @see context.md Section 2 (requireAiCredits)
 */

import { ConvexError, v } from "convex/values";

import { internalQuery } from "../_generated/server";
import { BILLING_ERRORS } from "./errors";

// ===========================================================================
// requireActiveSubscription — Kiem tra dang ky hoat dong / Check active subscription
// ===========================================================================

/**
 * Checks if the organization has an active subscription.
 *
 * Access matrix:
 *   active / trial       -> full access (mutations + queries + AI)
 *   grace_period         -> read-only (throws with accessLevel: "read_only")
 *   expired / suspended  -> blocked (throws SUBSCRIPTION_INACTIVE)
 *   undefined (legacy)   -> treated as active (full access)
 *
 * vi: "Kiem tra dang ky hoat dong truoc moi mutation/query duoc bao ve"
 * en: "Check active subscription before every protected mutation/query"
 */
export const requireActiveSubscription = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: BILLING_ERRORS.ORG_NOT_FOUND.code,
        message: BILLING_ERRORS.ORG_NOT_FOUND.message,
        messageVi: BILLING_ERRORS.ORG_NOT_FOUND.messageVi,
      });
    }

    const status = org.status;

    // Khong co trang thai (legacy) hoac dang hoat dong/dung thu -> full access
    // No status (legacy orgs) or active/trial -> full access
    if (!status || status === "active" || status === "trial") {
      return { org, accessLevel: "full" as const };
    }

    // Gia han — chi doc / Grace period — read-only access
    if (status === "grace_period") {
      throw new ConvexError({
        code: BILLING_ERRORS.SUBSCRIPTION_GRACE_PERIOD.code,
        message: "Subscription expired. Read-only access during grace period.",
        messageVi: "Dang ky da het han. Chi duoc xem trong thoi gian gia han.",
        accessLevel: "read_only" as const,
        gracePeriodEndsAt: org.gracePeriodEndsAt,
      });
    }

    // Het han hoac tam ngung / Expired or suspended — no access
    throw new ConvexError({
      code: BILLING_ERRORS.SUBSCRIPTION_INACTIVE.code,
      message: "Subscription is inactive. Please contact your administrator.",
      messageVi: "Dang ky khong hoat dong. Vui long lien he quan tri vien.",
      status: status,
    });
  },
});

// ===========================================================================
// requireAiCredits — Kiem tra credit AI / Check AI credit availability
// ===========================================================================

/**
 * Checks if the organization has sufficient AI credits before Claude API calls.
 *
 * Credit consumption priority (Phase 1):
 *   1. Organization's shared credit pool (from subscription plan)
 *   2. Bonus credits (admin-granted, do not reset monthly)
 *
 * Only active and trial orgs can use AI features.
 * Grace period, expired, and suspended orgs are blocked.
 *
 * vi: "Kiem tra credit AI truoc khi goi API Claude"
 * en: "Check AI credit availability before Claude API calls"
 */
export const requireAiCredits = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    creditsRequired: v.number(),
  },
  handler: async (ctx, args) => {
    // Buoc 1: Kiem tra to chuc ton tai va hoat dong
    // Step 1: Check org exists and is active
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: BILLING_ERRORS.ORG_NOT_FOUND.code,
        message: BILLING_ERRORS.ORG_NOT_FOUND.message,
        messageVi: BILLING_ERRORS.ORG_NOT_FOUND.messageVi,
      });
    }

    // Chi active va trial moi duoc dung AI / Only active and trial can use AI
    const status = org.status;
    if (status && status !== "active" && status !== "trial") {
      throw new ConvexError({
        code: BILLING_ERRORS.SUBSCRIPTION_INACTIVE.code,
        message: "Active subscription required for AI features",
        messageVi: "Can dang ky hoat dong de su dung tinh nang AI",
      });
    }

    // Buoc 2: Kiem tra so du credit AI / Step 2: Check org AI credit balance
    const orgCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!orgCredits) {
      throw new ConvexError({
        code: BILLING_ERRORS.NO_CREDITS_RECORD.code,
        message: "AI credits not initialized for this organization",
        messageVi: "Credit AI chua duoc khoi tao cho to chuc nay",
      });
    }

    // Buoc 3: Xac dinh nguon credit / Step 3: Determine credit source
    // Phase 1: org pool first, then bonus
    const orgAvailable = orgCredits.balance;
    const bonusAvailable = orgCredits.bonusCredits ?? 0;
    const totalAvailable = orgAvailable + bonusAvailable;

    if (totalAvailable < args.creditsRequired) {
      throw new ConvexError({
        code: BILLING_ERRORS.INSUFFICIENT_CREDITS.code,
        message: `Insufficient AI credits. Available: ${totalAvailable}, Required: ${args.creditsRequired}`,
        messageVi: `Khong du credit AI. Hien co: ${totalAvailable}, Can: ${args.creditsRequired}`,
        available: totalAvailable,
        required: args.creditsRequired,
      });
    }

    // Uu tien nguon: org pool truoc, sau do bonus
    // Source priority: org pool first, then bonus
    let source: "org_pool" | "bonus" = "org_pool";
    if (
      orgAvailable < args.creditsRequired &&
      bonusAvailable >= args.creditsRequired
    ) {
      source = "bonus";
    }

    return {
      source,
      available: totalAvailable,
      orgCreditsId: orgCredits._id,
    };
  },
});
