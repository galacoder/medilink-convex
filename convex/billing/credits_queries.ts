/**
 * AI credit system queries: balance and consumption history.
 *
 * Provides reactive (real-time) queries for the credit balance dashboard
 * and consumption audit log.
 *
 * vi: "Truy van he thong credit AI -- so du va lich su"
 * en: "AI credit system queries -- balance and history"
 *
 * @see Issue #174 -- M1-5: AI Credit System
 */

import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

// ---------------------------------------------------------------------------
// getAiCreditBalance -- Real-time credit balance
// ---------------------------------------------------------------------------

/**
 * Lay so du credit AI / Get AI credit balance (reactive)
 *
 * Returns the current credit balance for an organization including:
 * - Monthly pool balance
 * - Bonus credits
 * - Total available (pool + bonus)
 * - Monthly usage tracking
 * - Lifetime statistics
 *
 * Returns null if no credits record exists for the organization.
 */
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
// getCreditConsumptionHistory -- Audit log with user names
// ---------------------------------------------------------------------------

/**
 * Lay lich su su dung credit / Get credit consumption history
 *
 * Returns consumption records for an organization in descending order
 * by creation time. Joins with user names for display.
 *
 * Default limit: 50 records.
 */
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
