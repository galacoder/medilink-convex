import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed an org + subscription + aiCredits record for cron tests */
async function seedCronContext(
  t: ReturnType<typeof convexTest>,
  opts: {
    orgStatus?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    balance?: number;
    monthlyIncluded?: number;
    monthlyUsed?: number;
    bonusCredits?: number;
  } = {},
) {
  let orgId: string = "";

  const {
    orgStatus = "active",
    subscriptionStatus = "active",
    subscriptionPlan = "professional",
    balance = 10,
    monthlyIncluded = 200,
    monthlyUsed = 190,
    bonusCredits,
  } = opts;

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Cron Test Org",
      slug: `cron-test-org-${Date.now()}`,
      org_type: "hospital",
      status: orgStatus as "active" | "trial" | "suspended" | "expired",
      subscriptionPlan: subscriptionPlan as
        | "starter"
        | "professional"
        | "enterprise"
        | "trial",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create active subscription
    const now = Date.now();
    await ctx.db.insert("subscriptions", {
      organizationId: orgId as any,
      plan: subscriptionPlan as
        | "starter"
        | "professional"
        | "enterprise"
        | "trial",
      billingCycle: "monthly_3",
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now + 60 * 24 * 60 * 60 * 1000,
      amountVnd: 5000000,
      status: subscriptionStatus as
        | "active"
        | "expired"
        | "cancelled"
        | "renewed",
      monthlyAiCredits: monthlyIncluded,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("aiCredits", {
      organizationId: orgId as any,
      balance,
      lifetimeCreditsGranted: 400,
      lifetimeCreditsUsed: monthlyUsed,
      monthlyIncluded,
      monthlyUsed,
      monthlyResetAt: Date.now(), // Due for reset
      ...(bonusCredits !== undefined ? { bonusCredits } : {}),
      updatedAt: Date.now(),
    });
  });

  return { orgId };
}

// ===========================================================================
// AC8+AC9: Monthly credit reset — no rollover, balance set to monthlyIncluded
// ===========================================================================

describe("monthlyAiCreditReset", () => {
  it("resets monthly credits for active organizations", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCronContext(t, {
      balance: 10,
      monthlyIncluded: 200,
      monthlyUsed: 190,
    });

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    // Verify reset
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();

      expect(credits!.balance).toBe(200); // Reset to monthlyIncluded (no rollover)
      expect(credits!.monthlyUsed).toBe(0); // Reset to 0
    });
  });

  it("preserves bonus credits during reset", async () => {
    const t = convexTest(schema, modules);
    await seedCronContext(t, {
      balance: 10,
      bonusCredits: 25,
      monthlyUsed: 190,
    });

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    await t.run(async (ctx) => {
      const allCredits = await ctx.db.query("aiCredits").collect();
      // Find the one with bonus credits
      const credits = allCredits.find((c) => c.bonusCredits === 25);
      expect(credits).toBeDefined();
      expect(credits!.bonusCredits).toBe(25); // Bonus untouched
      expect(credits!.balance).toBe(200); // org pool reset
    });
  });

  it("skips inactive organizations", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCronContext(t, {
      orgStatus: "expired",
      subscriptionStatus: "expired",
      balance: 10,
      monthlyUsed: 40,
    });

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    // Verify credits were NOT reset
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();

      expect(credits!.balance).toBe(10); // Unchanged
      expect(credits!.monthlyUsed).toBe(40); // Unchanged
    });
  });

  it("uses plan-specific credit amounts", async () => {
    const t = convexTest(schema, modules);
    await seedCronContext(t, {
      subscriptionPlan: "starter",
      monthlyIncluded: 50,
      balance: 5,
      monthlyUsed: 45,
    });

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    await t.run(async (ctx) => {
      const allCredits = await ctx.db.query("aiCredits").collect();
      const credits = allCredits.find((c) => c.monthlyIncluded === 50);
      expect(credits).toBeDefined();
      expect(credits!.balance).toBe(50); // Reset to starter plan amount
    });
  });

  it("updates lifetimeCreditsGranted on reset", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCronContext(t, {
      balance: 10,
      monthlyIncluded: 200,
      monthlyUsed: 190,
    });

    // Get initial lifetime granted
    let initialGranted = 0;
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      initialGranted = credits!.lifetimeCreditsGranted;
    });

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.lifetimeCreditsGranted).toBe(initialGranted + 200);
    });
  });

  it("sets monthlyResetAt to 1st of next month UTC", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCronContext(t);

    await t.action(internal.billing.crons.monthlyAiCreditReset, {});

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();

      // monthlyResetAt should be the 1st of next month at 00:00 UTC
      const resetDate = new Date(credits!.monthlyResetAt);
      expect(resetDate.getUTCDate()).toBe(1);
      expect(resetDate.getUTCHours()).toBe(0);
      expect(resetDate.getUTCMinutes()).toBe(0);
    });
  });
});
