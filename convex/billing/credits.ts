/**
 * AI credit system mutations: deduction, refund, and bonus grants.
 *
 * Implements the "deduct-before-Claude" pattern:
 * 1. deductAiCredits -- atomically deduct credits + create consumption audit
 * 2. updateCreditConsumption -- mark completion or trigger refund on failure
 * 3. grantBonusCredits -- admin-only bonus credit grants
 *
 * vi: "He thong credit AI -- tru, hoan tra, cap thuong"
 * en: "AI credit system -- deduction, refund, bonus grants"
 *
 * @see Issue #174 -- M1-5: AI Credit System
 */

import { ConvexError, v } from "convex/values";

import { internalMutation } from "../_generated/server";
import type { AiFeatureId } from "./creditCosts";
import { AI_CREDIT_COSTS } from "./creditCosts";

// ---------------------------------------------------------------------------
// deductAiCredits -- Deduct-before-Claude pattern
// ---------------------------------------------------------------------------

/**
 * Tru credit AI / Deduct AI credits (deduct-before-Claude pattern)
 *
 * Atomically:
 * 1. Validates featureId against AI_CREDIT_COSTS
 * 2. Checks credit balance (org_pool first, then bonus)
 * 3. Deducts credits from the appropriate source
 * 4. Creates an immutable consumption audit record (status: "pending")
 *
 * Returns consumptionId for subsequent updateCreditConsumption call.
 *
 * Credit source priority:
 *   org_pool (monthly subscription credits) > bonus (admin-granted)
 */
export const deductAiCredits = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    featureId: v.string(), // Must be a valid AiFeatureId
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate featureId
    const featureConfig = AI_CREDIT_COSTS[args.featureId as AiFeatureId];
    if (!featureConfig) {
      throw new ConvexError({
        code: "INVALID_FEATURE",
        message: `Unknown AI feature: ${args.featureId}`,
        messageVi: `Tinh nang AI khong hop le: ${args.featureId}`,
      });
    }

    const creditsToDeduct = featureConfig.credits;

    // 2. Get org credit record
    const orgCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!orgCredits) {
      throw new ConvexError({
        code: "NO_CREDITS_RECORD",
        message: "AI credits not initialized for this organization",
        messageVi: "Credit AI chua duoc khoi tao cho to chuc nay",
      });
    }

    // 3. Determine source and check balance
    // Phase 1: org_pool first, then bonus
    let source: "org_pool" | "bonus" = "org_pool";
    const orgPoolAvailable = orgCredits.balance;
    const bonusAvailable = orgCredits.bonusCredits ?? 0;

    if (orgPoolAvailable >= creditsToDeduct) {
      source = "org_pool";
    } else if (orgPoolAvailable + bonusAvailable >= creditsToDeduct) {
      source = "bonus";
    } else {
      throw new ConvexError({
        code: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. Available: ${orgPoolAvailable + bonusAvailable}, Required: ${creditsToDeduct}`,
        messageVi: `Khong du credit. Hien co: ${orgPoolAvailable + bonusAvailable}, Can: ${creditsToDeduct}`,
        available: orgPoolAvailable + bonusAvailable,
        required: creditsToDeduct,
      });
    }

    // 4. Atomically deduct credits
    if (source === "org_pool") {
      await ctx.db.patch(orgCredits._id, {
        balance: orgCredits.balance - creditsToDeduct,
        monthlyUsed: orgCredits.monthlyUsed + creditsToDeduct,
        lifetimeCreditsUsed: orgCredits.lifetimeCreditsUsed + creditsToDeduct,
        updatedAt: Date.now(),
      });
    } else {
      // Deduct from bonus credits
      await ctx.db.patch(orgCredits._id, {
        bonusCredits: bonusAvailable - creditsToDeduct,
        lifetimeCreditsUsed: orgCredits.lifetimeCreditsUsed + creditsToDeduct,
        updatedAt: Date.now(),
      });
    }

    // 5. Create consumption audit record
    const consumptionId = await ctx.db.insert("aiCreditConsumption", {
      organizationId: args.organizationId,
      userId: args.userId,
      featureId: args.featureId,
      creditsUsed: creditsToDeduct,
      creditSource: source,
      claudeModel: featureConfig.model,
      entityType: args.entityType,
      entityId: args.entityId,
      status: "pending",
      createdAt: Date.now(),
    });

    return { consumptionId, creditsDeducted: creditsToDeduct, source };
  },
});

// ---------------------------------------------------------------------------
// updateCreditConsumption -- Complete or refund after Claude API call
// ---------------------------------------------------------------------------

/**
 * Cap nhat trang thai consumption / Update consumption after Claude response
 *
 * Called after the Claude API call completes:
 * - "completed": Updates token counts and cost for margin analysis
 * - "failed": Updates error message AND refunds credits to original source
 */
export const updateCreditConsumption = internalMutation({
  args: {
    consumptionId: v.id("aiCreditConsumption"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    apiCostUsd: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const consumption = await ctx.db.get(args.consumptionId);
    if (!consumption) {
      throw new ConvexError({
        code: "CONSUMPTION_NOT_FOUND",
        message: "Credit consumption record not found",
        messageVi: "Khong tim thay ban ghi su dung credit",
      });
    }

    // Update consumption record
    await ctx.db.patch(args.consumptionId, {
      status: args.status,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      apiCostUsd: args.apiCostUsd,
      errorMessage: args.errorMessage,
    });

    // If failed: REFUND credits to the original source
    if (args.status === "failed") {
      const orgCredits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", consumption.organizationId),
        )
        .unique();

      if (orgCredits) {
        if (consumption.creditSource === "org_pool") {
          await ctx.db.patch(orgCredits._id, {
            balance: orgCredits.balance + consumption.creditsUsed,
            monthlyUsed: Math.max(
              0,
              orgCredits.monthlyUsed - consumption.creditsUsed,
            ),
            lifetimeCreditsUsed: Math.max(
              0,
              orgCredits.lifetimeCreditsUsed - consumption.creditsUsed,
            ),
            updatedAt: Date.now(),
          });
        } else if (consumption.creditSource === "bonus") {
          await ctx.db.patch(orgCredits._id, {
            bonusCredits:
              (orgCredits.bonusCredits ?? 0) + consumption.creditsUsed,
            lifetimeCreditsUsed: Math.max(
              0,
              orgCredits.lifetimeCreditsUsed - consumption.creditsUsed,
            ),
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});

// ---------------------------------------------------------------------------
// grantBonusCredits -- Admin bonus credit grants
// ---------------------------------------------------------------------------

/**
 * Cap credit thuong / Grant bonus credits (admin only)
 *
 * Adds bonus credits to an organization. Bonus credits:
 * - Are NOT reset during monthly reset
 * - Are used AFTER org_pool credits are exhausted
 * - Are tracked in lifetimeCreditsGranted for reporting
 *
 * NOTE: Auth check is intentionally omitted here since this is an
 * internalMutation. The caller (admin action) is responsible for auth.
 */
export const grantBonusCredits = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    credits: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate positive credit amount
    if (args.credits <= 0) {
      throw new ConvexError({
        code: "INVALID_AMOUNT",
        message: "Credit amount must be positive",
        messageVi: "So luong credit phai lon hon 0",
      });
    }

    // Get or create aiCredits record
    const orgCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (orgCredits) {
      // Update existing record
      await ctx.db.patch(orgCredits._id, {
        bonusCredits: (orgCredits.bonusCredits ?? 0) + args.credits,
        lifetimeCreditsGranted:
          orgCredits.lifetimeCreditsGranted + args.credits,
        updatedAt: Date.now(),
      });
    } else {
      // Create new record with only bonus credits
      await ctx.db.insert("aiCredits", {
        organizationId: args.organizationId,
        balance: 0,
        lifetimeCreditsGranted: args.credits,
        lifetimeCreditsUsed: 0,
        monthlyIncluded: 0,
        monthlyUsed: 0,
        monthlyResetAt: Date.now(),
        bonusCredits: args.credits,
        updatedAt: Date.now(),
      });
    }

    console.log(
      `[BILLING] Granted ${args.credits} bonus credits to org ${args.organizationId}` +
        (args.reason ? ` — reason: ${args.reason}` : ""),
    );
  },
});
