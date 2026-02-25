/**
 * AI credit deduction, refund, and bonus grant mutations.
 *
 * WHY: Implements the "deduct-before-Claude" pattern where credits are
 * atomically deducted before making an API call, then either confirmed
 * or refunded based on the outcome. This ensures no overuse and creates
 * an immutable audit trail.
 *
 * vi: "Tru credit AI, hoan tra, va cap thuong"
 * en: "AI credit deduction, refund, and bonus grant"
 */

import { ConvexError, v } from "convex/values";

import type { AiFeatureId } from "./creditCosts";
import { internalMutation } from "../_generated/server";
import { AI_CREDIT_COSTS } from "./creditCosts";

// ---------------------------------------------------------------------------
// Tru credit AI / Deduct AI credits (deduct-before-Claude pattern)
// ---------------------------------------------------------------------------

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
// Cap nhat trang thai consumption / Update consumption after Claude response
// ---------------------------------------------------------------------------

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
// Cap credit thuong / Grant bonus credits (admin only)
// ---------------------------------------------------------------------------

export const grantBonusCredits = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    credits: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate positive amount
    if (args.credits <= 0) {
      throw new ConvexError({
        code: "INVALID_AMOUNT",
        message: "Credit amount must be positive",
        messageVi: "So luong credit phai la so duong",
      });
    }

    // Get existing credit record
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

    // Add bonus credits
    const currentBonus = orgCredits.bonusCredits ?? 0;
    await ctx.db.patch(orgCredits._id, {
      bonusCredits: currentBonus + args.credits,
      lifetimeCreditsGranted: orgCredits.lifetimeCreditsGranted + args.credits,
      updatedAt: Date.now(),
    });

    return {
      newBonusBalance: currentBonus + args.credits,
      totalAvailable: orgCredits.balance + currentBonus + args.credits,
    };
  },
});
