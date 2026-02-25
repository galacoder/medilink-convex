/**
 * Monthly AI credit reset cron handler.
 *
 * WHY: Credits reset on the 1st of every month to prevent hoarding
 * and ensure predictable billing. Bonus credits are preserved as they
 * are admin-granted incentives.
 *
 * vi: "Xu ly reset credit AI hang thang"
 * en: "Monthly AI credit reset handler"
 */
import type { SubscriptionPlan } from "./creditCosts";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { MONTHLY_CREDITS_BY_PLAN } from "./creditCosts";

// ---------------------------------------------------------------------------
// Internal query: get all aiCredits records for active orgs
// ---------------------------------------------------------------------------

export const getAllActiveOrgCredits = internalQuery({
  handler: async (ctx) => {
    const allCredits = await ctx.db.query("aiCredits").collect();

    const results = [];
    for (const credit of allCredits) {
      // Get the organization to check status
      const org = await ctx.db.get(credit.organizationId);
      if (!org) continue;

      // Only reset for active or trial orgs
      const orgStatus = org.status ?? "active";
      if (orgStatus !== "active" && orgStatus !== "trial") continue;

      // Get active subscription to determine plan
      const activeSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_organizationId_status", (q) =>
          q.eq("organizationId", credit.organizationId).eq("status", "active"),
        )
        .first();

      if (!activeSub) continue;

      results.push({
        creditId: credit._id,
        organizationId: credit.organizationId,
        plan: activeSub.plan as SubscriptionPlan,
        currentLifetimeGranted: credit.lifetimeCreditsGranted,
      });
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// Internal mutation: reset credits for a single org
// ---------------------------------------------------------------------------

export const resetOrgCredits = internalMutation({
  handler: async (
    ctx,
    args: {
      creditId: string;
      monthlyIncluded: number;
      currentLifetimeGranted: number;
    },
  ) => {
    // Calculate next month's 1st day at 00:00 UTC
    const now = new Date();
    const nextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );

    await ctx.db.patch(args.creditId as any, {
      balance: args.monthlyIncluded,
      monthlyUsed: 0,
      monthlyIncluded: args.monthlyIncluded,
      monthlyResetAt: nextMonth.getTime(),
      lifetimeCreditsGranted:
        args.currentLifetimeGranted + args.monthlyIncluded,
      updatedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Reset credit AI hang thang / Monthly AI credit reset
// Chay vao ngay 1 moi thang luc 00:00 UTC
// Runs on the 1st of every month at 00:00 UTC
// ---------------------------------------------------------------------------

export const monthlyAiCreditReset = internalAction({
  handler: async (ctx) => {
    // 1. Get all active org credit records
    const activeOrgs = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "billing/crons:getAllActiveOrgCredits" as any,
      {},
    );

    let resetCount = 0;

    // 2. For each active org, reset credits based on plan
    for (const org of activeOrgs as Array<{
      creditId: string;
      organizationId: string;
      plan: SubscriptionPlan;
      currentLifetimeGranted: number;
    }>) {
      const monthlyIncluded =
        MONTHLY_CREDITS_BY_PLAN[org.plan] ?? MONTHLY_CREDITS_BY_PLAN.starter;

      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "billing/crons:resetOrgCredits" as any,
        {
          creditId: org.creditId,
          monthlyIncluded,
          currentLifetimeGranted: org.currentLifetimeGranted,
        },
      );

      resetCount++;
    }

    // 3. Log total orgs reset for monitoring
    console.log(
      `[monthlyAiCreditReset] Reset credits for ${resetCount} organizations`,
    );
  },
});
