import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import { AI_CREDIT_COSTS } from "./billing/creditCosts";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse ConvexError data which convex-test serializes as a JSON string.
 * vi: "Phan tich du lieu loi ConvexError" / en: "Parse ConvexError data"
 */
function parseConvexErrorData(e: unknown): Record<string, unknown> {
  const convexErr = e as ConvexError<unknown>;
  const raw = convexErr.data;
  if (typeof raw === "string") {
    return JSON.parse(raw) as Record<string, unknown>;
  }
  return raw as Record<string, unknown>;
}

/** Create a base org + user + aiCredits record for tests */
async function seedCreditContext(
  t: ReturnType<typeof convexTest>,
  opts: {
    balance?: number;
    bonusCredits?: number;
    monthlyIncluded?: number;
    monthlyUsed?: number;
    orgStatus?: string;
  } = {},
) {
  let orgId: string = "";
  let userId: string = "";
  let creditId: string = "";

  const {
    balance = 50,
    bonusCredits,
    monthlyIncluded = 200,
    monthlyUsed = 0,
    orgStatus = "active",
  } = opts;

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Credit Test Org",
      slug: "credit-test-org",
      org_type: "hospital",
      status: orgStatus as "active" | "trial" | "suspended",
      subscriptionPlan: "professional",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    userId = await ctx.db.insert("users", {
      name: "Credit Test User",
      email: "credit-user@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    creditId = await ctx.db.insert("aiCredits", {
      organizationId: orgId as any,
      balance,
      lifetimeCreditsGranted: 400,
      lifetimeCreditsUsed: 200,
      monthlyIncluded,
      monthlyUsed,
      monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      ...(bonusCredits !== undefined ? { bonusCredits } : {}),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId, creditId };
}

// ===========================================================================
// AC1: AI_CREDIT_COSTS constant table
// ===========================================================================

describe("AI_CREDIT_COSTS constant table", () => {
  it("has all 6 features with correct credit amounts", () => {
    expect(AI_CREDIT_COSTS.equipment_diagnosis.credits).toBe(5);
    expect(AI_CREDIT_COSTS.report_generation.credits).toBe(10);
    expect(AI_CREDIT_COSTS.manual_search.credits).toBe(1);
    expect(AI_CREDIT_COSTS.maintenance_prediction.credits).toBe(3);
    expect(AI_CREDIT_COSTS.training_material.credits).toBe(8);
    expect(AI_CREDIT_COSTS.inventory_optimization.credits).toBe(15);
  });

  it("each feature has model and bilingual descriptions", () => {
    for (const [, config] of Object.entries(AI_CREDIT_COSTS)) {
      expect(config.model).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.descriptionVi).toBeTruthy();
    }
  });
});

// ===========================================================================
// AC2: deductAiCredits atomically deducts credits + creates consumption record
// ===========================================================================

describe("deductAiCredits", () => {
  it("atomically deducts credits and creates consumption record", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    expect(result.creditsDeducted).toBe(5);
    expect(result.source).toBe("org_pool");
    expect(result.consumptionId).toBeTruthy();

    // Verify balance was deducted
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(45);
      expect(credits!.monthlyUsed).toBe(5);
      expect(credits!.lifetimeCreditsUsed).toBe(205);
    });

    // Verify consumption record was created
    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(result.consumptionId);
      expect(consumption).not.toBeNull();
      expect(consumption!.status).toBe("pending");
      expect(consumption!.featureId).toBe("equipment_diagnosis");
      expect(consumption!.creditsUsed).toBe(5);
      expect(consumption!.creditSource).toBe("org_pool");
      expect(consumption!.claudeModel).toBe("claude-sonnet-4-5");
    });
  });

  it("rejects deduction when insufficient credits", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 3 });

    try {
      await t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const data = parseConvexErrorData(e);
      expect(data.code).toBe("INSUFFICIENT_CREDITS");
    }

    // Verify balance unchanged
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(3);
    });
  });

  it("uses bonus credits when org pool insufficient", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, {
      balance: 2,
      bonusCredits: 10,
    });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    expect(result.source).toBe("bonus");
    expect(result.creditsDeducted).toBe(5);

    // Verify bonus credits deducted, org balance unchanged
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(2); // org_pool unchanged
      expect(credits!.bonusCredits).toBe(5); // 10 - 5 = 5
    });
  });

  it("rejects deduction for invalid feature ID", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t);

    try {
      await t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "nonexistent_feature",
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const data = parseConvexErrorData(e);
      expect(data.code).toBe("INVALID_FEATURE");
    }
  });

  it("rejects deduction when no credit record exists", async () => {
    const t = convexTest(schema, modules);

    // Create org + user but NO aiCredits record
    let orgId: string = "";
    let userId: string = "";
    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "No Credit Org",
        slug: "no-credit-org",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      userId = await ctx.db.insert("users", {
        name: "User",
        email: "user@test.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    try {
      await t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const data = parseConvexErrorData(e);
      expect(data.code).toBe("NO_CREDITS_RECORD");
    }
  });

  it("stores optional entity context in consumption record", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
      entityType: "equipment",
      entityId: "eq_12345",
    });

    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(result.consumptionId);
      expect(consumption!.entityType).toBe("equipment");
      expect(consumption!.entityId).toBe("eq_12345");
    });
  });
});

// ===========================================================================
// AC3: updateCreditConsumption updates status and refunds on failure
// ===========================================================================

describe("updateCreditConsumption", () => {
  it("marks consumption as completed with token details", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    // First deduct
    const deductResult = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      },
    );

    // Then mark completed
    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: deductResult.consumptionId,
      status: "completed",
      promptTokens: 1500,
      completionTokens: 800,
      apiCostUsd: 0.05,
    });

    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(deductResult.consumptionId);
      expect(consumption!.status).toBe("completed");
      expect(consumption!.promptTokens).toBe(1500);
      expect(consumption!.completionTokens).toBe(800);
      expect(consumption!.apiCostUsd).toBe(0.05);
    });
  });

  it("refunds credits on failed API call (org_pool source)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    // Deduct credits
    const deductResult = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      },
    );

    // Verify balance after deduction
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(45);
    });

    // Mark as failed -> should refund
    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: deductResult.consumptionId,
      status: "failed",
      errorMessage: "Claude API timeout",
    });

    // Verify credits were refunded
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(50); // Restored
      expect(credits!.monthlyUsed).toBe(0); // Reversed
    });

    // Verify consumption status is "failed"
    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(deductResult.consumptionId);
      expect(consumption!.status).toBe("failed");
      expect(consumption!.errorMessage).toBe("Claude API timeout");
    });
  });

  it("refunds credits on failed API call (bonus source)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, {
      balance: 2,
      bonusCredits: 10,
    });

    // Deduct from bonus
    const deductResult = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      },
    );

    expect(deductResult.source).toBe("bonus");

    // Mark as failed -> should refund to bonus
    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: deductResult.consumptionId,
      status: "failed",
      errorMessage: "API error",
    });

    // Verify bonus credits were refunded
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(10); // Restored
      expect(credits!.balance).toBe(2); // org_pool unchanged
    });
  });

  it("throws when consumption record not found", async () => {
    const t = convexTest(schema, modules);

    // Create a fake consumption ID by inserting and deleting
    let fakeId: string = "";
    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Temp Org",
        slug: "temp-org",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const userId = await ctx.db.insert("users", {
        name: "Temp User",
        email: "temp@test.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      fakeId = await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId,
        userId: userId,
        featureId: "test",
        creditsUsed: 1,
        creditSource: "org_pool",
        status: "pending",
        createdAt: Date.now(),
      });
      // Delete it so lookup fails
      await ctx.db.delete(fakeId as any);
    });

    try {
      await t.mutation(internal.billing.credits.updateCreditConsumption, {
        consumptionId: fakeId as any,
        status: "completed",
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const data = parseConvexErrorData(e);
      expect(data.code).toBe("CONSUMPTION_NOT_FOUND");
    }
  });
});

// ===========================================================================
// AC5: grantBonusCredits admin mutation
// ===========================================================================

describe("grantBonusCredits", () => {
  it("adds bonus credits to existing record", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCreditContext(t, {
      balance: 50,
      bonusCredits: 10,
    });

    // Grant bonus as platform admin
    const authed = t.withIdentity({
      subject: "admin@medilink.vn",
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    await authed.mutation(internal.billing.credits.grantBonusCredits, {
      organizationId: orgId as any,
      credits: 25,
      reason: "Promotional bonus",
    });

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(35); // 10 + 25
    });
  });

  it("initializes bonus credits from zero", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCreditContext(t, { balance: 50 });

    const authed = t.withIdentity({
      subject: "admin@medilink.vn",
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    await authed.mutation(internal.billing.credits.grantBonusCredits, {
      organizationId: orgId as any,
      credits: 100,
    });

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(100);
    });
  });

  it("rejects negative credit amounts", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCreditContext(t);

    const authed = t.withIdentity({
      subject: "admin@medilink.vn",
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    try {
      await authed.mutation(internal.billing.credits.grantBonusCredits, {
        organizationId: orgId as any,
        credits: -5,
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const data = parseConvexErrorData(e);
      expect(data.code).toBe("INVALID_AMOUNT");
    }
  });
});

// ===========================================================================
// AC6: getAiCreditBalance reactive query
// ===========================================================================

describe("getAiCreditBalance", () => {
  it("returns real-time balance information", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedCreditContext(t, {
      balance: 150,
      bonusCredits: 25,
      monthlyIncluded: 200,
      monthlyUsed: 50,
    });

    const result = await t.query(
      internal.billing.credits_queries.getAiCreditBalance,
      {
        organizationId: orgId as any,
      },
    );

    expect(result).not.toBeNull();
    expect(result!.balance).toBe(150);
    expect(result!.bonusCredits).toBe(25);
    expect(result!.totalAvailable).toBe(175); // 150 + 25
    expect(result!.monthlyIncluded).toBe(200);
    expect(result!.monthlyUsed).toBe(50);
  });

  it("returns null when no credit record exists", async () => {
    const t = convexTest(schema, modules);

    let orgId: string = "";
    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "No Credits Org",
        slug: "no-credits-org",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(
      internal.billing.credits_queries.getAiCreditBalance,
      {
        organizationId: orgId as any,
      },
    );

    expect(result).toBeNull();
  });
});

// ===========================================================================
// AC7: getCreditConsumptionHistory returns audit log with user names
// ===========================================================================

describe("getCreditConsumptionHistory", () => {
  it("returns consumption records with user names", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    // Create some consumption records
    await t.run(async (ctx) => {
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
        creditsUsed: 5,
        creditSource: "org_pool",
        status: "completed",
        claudeModel: "claude-sonnet-4-5",
        createdAt: Date.now() - 1000,
      });
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "report_generation",
        creditsUsed: 10,
        creditSource: "org_pool",
        status: "pending",
        claudeModel: "claude-sonnet-4-5",
        createdAt: Date.now(),
      });
    });

    const results = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
      },
    );

    expect(results.length).toBe(2);
    // Results should be in descending order (most recent first)
    expect(results[0].featureId).toBe("report_generation");
    expect(results[1].featureId).toBe("equipment_diagnosis");
    // Each result should have userName
    expect(results[0].userName).toBe("Credit Test User");
    expect(results[1].userName).toBe("Credit Test User");
  });

  it("respects limit parameter", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedCreditContext(t, { balance: 50 });

    // Create 3 records
    await t.run(async (ctx) => {
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("aiCreditConsumption", {
          organizationId: orgId as any,
          userId: userId as any,
          featureId: "manual_search",
          creditsUsed: 1,
          creditSource: "org_pool",
          status: "completed",
          createdAt: Date.now() + i * 1000,
        });
      }
    });

    const results = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
        limit: 2,
      },
    );

    expect(results.length).toBe(2);
  });
});
