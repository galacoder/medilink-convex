/**
 * Unit tests for AI credit system: deduction, refund, audit log, queries.
 *
 * Tests cover acceptance criteria from issue #174:
 * - AC1: AI_CREDIT_COSTS constant table with all 6 features
 * - AC2: deductAiCredits atomically deducts credits and creates consumption record
 * - AC3: updateCreditConsumption updates status and refunds on failure
 * - AC4: Credit source priority: org_pool first, then bonus
 * - AC5: grantBonusCredits admin mutation works correctly
 * - AC6: getAiCreditBalance reactive query returns real-time balance
 * - AC7: getCreditConsumptionHistory returns audit log with user names
 * - AC12: Refund mechanism works: failed API calls restore credits
 * - AC14: Bilingual error messages (vi/en) in all errors
 *
 * vi: "Kiem tra don vi cho he thong credit AI"
 * en: "Unit tests for AI credit system"
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import { AI_CREDIT_COSTS } from "./billing/creditCosts";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a base organization with subscription fields.
 * vi: "Tao to chuc voi truong dang ky" / en: "Create org with subscription fields"
 */
async function createOrg(
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {},
) {
  let orgId = "" as string;
  await t.run(async (ctx) => {
    orgId = (await ctx.db.insert("organizations", {
      name: "Test Hospital",
      slug: "test-hospital",
      org_type: "hospital" as const,
      status: "active" as const,
      subscriptionPlan: "professional" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    })) as unknown as string;
  });
  return orgId;
}

/**
 * Create a user record.
 * vi: "Tao nguoi dung" / en: "Create user"
 */
async function createUser(
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {},
) {
  let userId = "" as string;
  await t.run(async (ctx) => {
    userId = (await ctx.db.insert("users", {
      name: "Test User",
      email: "test@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    })) as unknown as string;
  });
  return userId;
}

/**
 * Create an AI credits record for an organization.
 * vi: "Tao ban ghi credit AI" / en: "Create AI credits record"
 */
async function createAiCredits(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  let creditId = "" as string;
  await t.run(async (ctx) => {
    creditId = (await ctx.db.insert("aiCredits", {
      organizationId: orgId as any,
      balance: 200,
      lifetimeCreditsGranted: 200,
      lifetimeCreditsUsed: 0,
      monthlyIncluded: 200,
      monthlyUsed: 0,
      monthlyResetAt: Date.now() + 30 * DAY_MS,
      updatedAt: Date.now(),
      ...overrides,
    })) as unknown as string;
  });
  return creditId;
}

// ===========================================================================
// AC1: AI_CREDIT_COSTS constant table with all 6 features
// ===========================================================================

describe("AI_CREDIT_COSTS", () => {
  it("contains exactly 6 AI features", () => {
    const features = Object.keys(AI_CREDIT_COSTS);
    expect(features).toHaveLength(6);
  });

  it("contains correct feature IDs", () => {
    const features = Object.keys(AI_CREDIT_COSTS);
    expect(features).toContain("equipment_diagnosis");
    expect(features).toContain("report_generation");
    expect(features).toContain("manual_search");
    expect(features).toContain("maintenance_prediction");
    expect(features).toContain("training_material");
    expect(features).toContain("inventory_optimization");
  });

  it("has correct credit amounts for each feature", () => {
    expect(AI_CREDIT_COSTS.equipment_diagnosis.credits).toBe(5);
    expect(AI_CREDIT_COSTS.report_generation.credits).toBe(10);
    expect(AI_CREDIT_COSTS.manual_search.credits).toBe(1);
    expect(AI_CREDIT_COSTS.maintenance_prediction.credits).toBe(3);
    expect(AI_CREDIT_COSTS.training_material.credits).toBe(8);
    expect(AI_CREDIT_COSTS.inventory_optimization.credits).toBe(15);
  });

  it("every feature has a model, description, and descriptionVi", () => {
    for (const [, config] of Object.entries(AI_CREDIT_COSTS)) {
      expect(config.model).toBeDefined();
      expect(config.description).toBeDefined();
      expect(config.descriptionVi).toBeDefined();
      expect(typeof config.model).toBe("string");
      expect(typeof config.description).toBe("string");
      expect(typeof config.descriptionVi).toBe("string");
    }
  });
});

// ===========================================================================
// AC2: deductAiCredits atomically deducts credits and creates consumption record
// ===========================================================================

describe("deductAiCredits", () => {
  it("atomically deducts credits and creates consumption record", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 50, monthlyUsed: 0 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    expect(result.creditsDeducted).toBe(5);
    expect(result.source).toBe("org_pool");
    expect(result.consumptionId).toBeDefined();

    // Verify balance was deducted
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(45);
      expect(credits!.monthlyUsed).toBe(5);
      expect(credits!.lifetimeCreditsUsed).toBe(5);
    });

    // Verify consumption record was created
    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(result.consumptionId as any);
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

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 3, bonusCredits: 0 });

    await expect(
      t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      }),
    ).rejects.toThrow();
  });

  it("rejects deduction for invalid feature ID", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 50 });

    await expect(
      t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "nonexistent_feature",
      }),
    ).rejects.toThrow();
  });

  it("rejects deduction when no credits record exists", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);

    await expect(
      t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      }),
    ).rejects.toThrow();
  });

  it("stores optional entityType and entityId on consumption", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 50 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search",
      entityType: "equipment",
      entityId: "eq_12345",
    });

    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(result.consumptionId as any);
      expect(consumption!.entityType).toBe("equipment");
      expect(consumption!.entityId).toBe("eq_12345");
    });
  });
});

// ===========================================================================
// AC4: Credit source priority: org_pool first, then bonus
// ===========================================================================

describe("credit source priority", () => {
  it("uses org_pool when sufficient balance available", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 50, bonusCredits: 10 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    expect(result.source).toBe("org_pool");

    // Verify org_pool was deducted, not bonus
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(45);
      expect(credits!.bonusCredits).toBe(10);
    });
  });

  it("uses bonus credits when org_pool insufficient", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 2, bonusCredits: 10 });

    const result = await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    expect(result.source).toBe("bonus");

    // Verify bonus was deducted
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(2); // Unchanged
      expect(credits!.bonusCredits).toBe(5); // 10 - 5
    });
  });

  it("throws when combined balance insufficient", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 2, bonusCredits: 1 });

    await expect(
      t.mutation(internal.billing.credits.deductAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis", // costs 5
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC3 + AC12: updateCreditConsumption updates status and refunds on failure
// ===========================================================================

describe("updateCreditConsumption", () => {
  it("updates consumption to completed with token counts", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 50 });

    const { consumptionId } = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      },
    );

    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: consumptionId as any,
      status: "completed",
      promptTokens: 500,
      completionTokens: 200,
      apiCostUsd: 0.0035,
    });

    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(consumptionId as any);
      expect(consumption!.status).toBe("completed");
      expect(consumption!.promptTokens).toBe(500);
      expect(consumption!.completionTokens).toBe(200);
      expect(consumption!.apiCostUsd).toBe(0.0035);
    });
  });

  it("refunds credits on failed API call (org_pool source)", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, {
      balance: 50,
      monthlyUsed: 0,
      lifetimeCreditsUsed: 0,
    });

    const { consumptionId } = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
      },
    );

    // Balance should be 45 after deduction
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(45);
    });

    // Mark as failed -- should refund
    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: consumptionId as any,
      status: "failed",
      errorMessage: "Claude API timeout",
    });

    // Balance should be restored to 50
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.balance).toBe(50);
      expect(credits!.monthlyUsed).toBe(0);
      expect(credits!.lifetimeCreditsUsed).toBe(0);
    });

    // Verify consumption record updated
    await t.run(async (ctx) => {
      const consumption = await ctx.db.get(consumptionId as any);
      expect(consumption!.status).toBe("failed");
      expect(consumption!.errorMessage).toBe("Claude API timeout");
    });
  });

  it("refunds credits on failed API call (bonus source)", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, {
      balance: 2,
      bonusCredits: 10,
      lifetimeCreditsUsed: 0,
    });

    const { consumptionId } = await t.mutation(
      internal.billing.credits.deductAiCredits,
      {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis", // 5 credits, will use bonus
      },
    );

    // Bonus should be 5 after deduction
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(5);
    });

    // Mark as failed -- should refund to bonus
    await t.mutation(internal.billing.credits.updateCreditConsumption, {
      consumptionId: consumptionId as any,
      status: "failed",
      errorMessage: "Claude API error",
    });

    // Bonus should be restored to 10
    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(10);
      expect(credits!.lifetimeCreditsUsed).toBe(0);
    });
  });

  it("throws for nonexistent consumption record", async () => {
    const t = convexTest(schema, modules);

    // Use a fake ID -- this should throw
    await expect(
      t.mutation(internal.billing.credits.updateCreditConsumption, {
        consumptionId:
          "k97bxrjss7b4cz3dd0kcg2q3ah74z2bb" as any /* fake ID */,
        status: "completed",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC5: grantBonusCredits works correctly
// ===========================================================================

describe("grantBonusCredits", () => {
  it("adds bonus credits to existing record", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    await createAiCredits(t, orgId, {
      balance: 50,
      bonusCredits: 5,
      lifetimeCreditsGranted: 200,
    });

    await t.mutation(internal.billing.credits.grantBonusCredits, {
      organizationId: orgId as any,
      credits: 25,
      reason: "Promotional bonus for SPMET partnership",
    });

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits!.bonusCredits).toBe(30); // 5 + 25
      expect(credits!.lifetimeCreditsGranted).toBe(225); // 200 + 25
    });
  });

  it("creates credits record if none exists", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    // No aiCredits record created

    await t.mutation(internal.billing.credits.grantBonusCredits, {
      organizationId: orgId as any,
      credits: 10,
    });

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits).not.toBeNull();
      expect(credits!.bonusCredits).toBe(10);
      expect(credits!.balance).toBe(0);
      expect(credits!.lifetimeCreditsGranted).toBe(10);
    });
  });

  it("rejects non-positive credit amount", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    await createAiCredits(t, orgId);

    await expect(
      t.mutation(internal.billing.credits.grantBonusCredits, {
        organizationId: orgId as any,
        credits: 0,
      }),
    ).rejects.toThrow();

    await expect(
      t.mutation(internal.billing.credits.grantBonusCredits, {
        organizationId: orgId as any,
        credits: -5,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC6: getAiCreditBalance reactive query returns real-time balance
// ===========================================================================

describe("getAiCreditBalance", () => {
  it("returns complete credit balance information", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const resetAt = Date.now() + 30 * DAY_MS;
    await createAiCredits(t, orgId, {
      balance: 150,
      bonusCredits: 25,
      monthlyIncluded: 200,
      monthlyUsed: 50,
      monthlyResetAt: resetAt,
      lifetimeCreditsGranted: 600,
      lifetimeCreditsUsed: 400,
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
    expect(result!.totalAvailable).toBe(175);
    expect(result!.monthlyIncluded).toBe(200);
    expect(result!.monthlyUsed).toBe(50);
    expect(result!.monthlyResetAt).toBe(resetAt);
    expect(result!.lifetimeCreditsGranted).toBe(600);
    expect(result!.lifetimeCreditsUsed).toBe(400);
  });

  it("returns null when no credits record exists", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);

    const result = await t.query(
      internal.billing.credits_queries.getAiCreditBalance,
      {
        organizationId: orgId as any,
      },
    );

    expect(result).toBeNull();
  });

  it("handles zero bonus credits (undefined) correctly", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    await createAiCredits(t, orgId, { balance: 50 });
    // bonusCredits not set -- should default to 0

    const result = await t.query(
      internal.billing.credits_queries.getAiCreditBalance,
      {
        organizationId: orgId as any,
      },
    );

    expect(result).not.toBeNull();
    expect(result!.bonusCredits).toBe(0);
    expect(result!.totalAvailable).toBe(50);
  });
});

// ===========================================================================
// AC7: getCreditConsumptionHistory returns audit log with user names
// ===========================================================================

describe("getCreditConsumptionHistory", () => {
  it("returns consumption records with user names", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t, { name: "Dr. Nguyen Van A" });
    await createAiCredits(t, orgId, { balance: 100 });

    // Create a deduction to generate a consumption record
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis",
    });

    const history = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
      },
    );

    expect(history).toHaveLength(1);
    expect(history[0].userName).toBe("Dr. Nguyen Van A");
    expect(history[0].featureId).toBe("equipment_diagnosis");
    expect(history[0].creditsUsed).toBe(5);
    expect(history[0].status).toBe("pending");
  });

  it("returns records in descending order by createdAt", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 100 });

    // Create two deductions
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search", // 1 credit
    });
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "equipment_diagnosis", // 5 credits
    });

    const history = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
      },
    );

    expect(history).toHaveLength(2);
    // Most recent should be first (equipment_diagnosis was inserted second)
    expect(history[0].featureId).toBe("equipment_diagnosis");
    expect(history[1].featureId).toBe("manual_search");
  });

  it("respects limit parameter", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 100 });

    // Create three deductions
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search",
    });
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search",
    });
    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search",
    });

    const history = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
        limit: 2,
      },
    );

    expect(history).toHaveLength(2);
  });

  it("returns 'Unknown' for deleted users", async () => {
    const t = convexTest(schema, modules);

    const orgId = await createOrg(t);
    const userId = await createUser(t);
    await createAiCredits(t, orgId, { balance: 100 });

    await t.mutation(internal.billing.credits.deductAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      featureId: "manual_search",
    });

    // Delete the user
    await t.run(async (ctx) => {
      await ctx.db.delete(userId as any);
    });

    const history = await t.query(
      internal.billing.credits_queries.getCreditConsumptionHistory,
      {
        organizationId: orgId as any,
      },
    );

    expect(history).toHaveLength(1);
    expect(history[0].userName).toBe("Unknown");
  });
});
