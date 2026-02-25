/**
 * AI credit balance and consumption history queries.
 *
 * WHY: Provides reactive (real-time) queries for the credit balance UI
 * and consumption audit log. These are separate from mutations for
 * clean module boundaries.
 *
 * vi: "Truy van so du credit AI va lich su su dung"
 * en: "AI credit balance and consumption history queries"
 */

import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

// ---------------------------------------------------------------------------
// Lay so du credit AI / Get AI credit balance (reactive)
// ---------------------------------------------------------------------------

export const getAiCreditBalance = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!credits) return null;

    return {
      balance: credits.balance,
      bonusCredits: credits.bonusCredits ?? 0,
      totalAvailable: credits.balance + (credits.bonusCredits ?? 0),
      monthlyIncluded: credits.monthlyIncluded,
      monthlyUsed: credits.monthlyUsed,
      monthlyResetAt: credits.monthlyResetAt,
      lifetimeCreditsGranted: credits.lifetimeCreditsGranted,
      lifetimeCreditsUsed: credits.lifetimeCreditsUsed,
    };
  },
});

// ---------------------------------------------------------------------------
// Lay lich su su dung credit / Get credit consumption history
// ---------------------------------------------------------------------------

export const getCreditConsumptionHistory = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const records = await ctx.db
      .query("aiCreditConsumption")
      .withIndex("by_organizationId_createdAt", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit);

    // Join with user names for display
    return Promise.all(
      records.map(async (record) => {
        const user = await ctx.db.get(record.userId);
        return {
          ...record,
          userName: user?.name ?? "Unknown",
        };
      }),
    );
  },
});
