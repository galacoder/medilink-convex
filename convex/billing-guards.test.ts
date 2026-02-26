import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse ConvexError data which convex-test serializes as a JSON string.
 * WHY: convex-test v0.0.41 serializes ConvexError.data as a string when
 * the error is thrown inside an internalQuery/mutation handler.
 */
function parseErrorData<T>(error: unknown): T {
  const convexError = error as ConvexError<unknown>;
  const raw = convexError.data;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

/** Create a base org + user for FK references */
async function seedBase(
  t: ReturnType<typeof convexTest>,
  overrides: {
    status?: "active" | "suspended" | "trial" | "grace_period" | "expired";
    gracePeriodEndsAt?: number;
  } = {},
) {
  let orgId: string = "";
  let userId: string = "";

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Guard Test Org",
      slug: "guard-test-org",
      org_type: "hospital",
      status: overrides.status ?? "active",
      gracePeriodEndsAt: overrides.gracePeriodEndsAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    userId = await ctx.db.insert("users", {
      name: "Guard Test User",
      email: "guard-test@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId };
}

/** Create an aiCredits record for an org */
async function seedAiCredits(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  overrides: {
    balance?: number;
    bonusCredits?: number;
  } = {},
) {
  let creditId: string = "";

  await t.run(async (ctx) => {
    creditId = await ctx.db.insert("aiCredits", {
      organizationId: orgId as any,
      balance: overrides.balance ?? 100,
      lifetimeCreditsGranted: 200,
      lifetimeCreditsUsed: 100,
      monthlyIncluded: 200,
      monthlyUsed: 100,
      monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      bonusCredits: overrides.bonusCredits,
      updatedAt: Date.now(),
    });
  });

  return { creditId };
}

// ===========================================================================
// requireActiveSubscription
// vi: "Kiem tra dang ky hoat dong" / en: "Check active subscription"
// ===========================================================================

describe("requireActiveSubscription", () => {
  it("allows active organizations with full access", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "active" });

    const result = await t.query(
      internal.billing.guards.requireActiveSubscription,
      { organizationId: orgId as any },
    );

    expect(result.accessLevel).toBe("full");
    expect(result.org).toBeDefined();
    expect(result.org.name).toBe("Guard Test Org");
  });

  it("allows trial organizations with full access", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "trial" });

    const result = await t.query(
      internal.billing.guards.requireActiveSubscription,
      { organizationId: orgId as any },
    );

    expect(result.accessLevel).toBe("full");
  });

  it("throws SUBSCRIPTION_GRACE_PERIOD for grace_period orgs", async () => {
    const t = convexTest(schema, modules);
    const gracePeriodEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const { orgId } = await seedBase(t, {
      status: "grace_period",
      gracePeriodEndsAt,
    });

    await expect(
      t.query(internal.billing.guards.requireActiveSubscription, {
        organizationId: orgId as any,
      }),
    ).rejects.toThrow(ConvexError);

    try {
      await t.query(internal.billing.guards.requireActiveSubscription, {
        organizationId: orgId as any,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{
        code: string;
        accessLevel: string;
        gracePeriodEndsAt: number;
      }>(error);
      expect(data.code).toBe("SUBSCRIPTION_GRACE_PERIOD");
      expect(data.accessLevel).toBe("read_only");
      expect(data.gracePeriodEndsAt).toBe(gracePeriodEndsAt);
    }
  });

  it("throws SUBSCRIPTION_INACTIVE for expired orgs", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "expired" });

    try {
      await t.query(internal.billing.guards.requireActiveSubscription, {
        organizationId: orgId as any,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string; status: string }>(error);
      expect(data.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(data.status).toBe("expired");
    }
  });

  it("throws SUBSCRIPTION_INACTIVE for suspended orgs", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "suspended" });

    try {
      await t.query(internal.billing.guards.requireActiveSubscription, {
        organizationId: orgId as any,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string; status: string }>(error);
      expect(data.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(data.status).toBe("suspended");
    }
  });

  it("throws ORG_NOT_FOUND for non-existent org ID", async () => {
    const t = convexTest(schema, modules);
    // Create a valid org first to get a well-formed ID, then delete it
    const { orgId } = await seedBase(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(orgId as any);
    });

    try {
      await t.query(internal.billing.guards.requireActiveSubscription, {
        organizationId: orgId as any,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("ORG_NOT_FOUND");
    }
  });

  it("treats org with no status field as active (defaults to full access)", async () => {
    const t = convexTest(schema, modules);
    let orgId: string = "";

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "No Status Org",
        slug: "no-status-org",
        org_type: "hospital",
        // No status field -- should default to active
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(
      internal.billing.guards.requireActiveSubscription,
      { organizationId: orgId as any },
    );

    expect(result.accessLevel).toBe("full");
  });
});

// ===========================================================================
// requireAiCredits
// vi: "Kiem tra credit AI" / en: "Check AI credits"
// ===========================================================================

describe("requireAiCredits", () => {
  it("returns org_pool source when org has enough credits in balance", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    await seedAiCredits(t, orgId, { balance: 50, bonusCredits: 0 });

    const result = await t.query(internal.billing.guards.requireAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      creditsRequired: 10,
    });

    expect(result.source).toBe("org_pool");
    expect(result.available).toBe(50);
    expect(result.orgCreditsId).toBeDefined();
  });

  it("returns bonus source when org pool insufficient but bonus covers it", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    await seedAiCredits(t, orgId, { balance: 3, bonusCredits: 20 });

    const result = await t.query(internal.billing.guards.requireAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      creditsRequired: 10,
    });

    expect(result.source).toBe("bonus");
    expect(result.available).toBe(23); // 3 + 20
  });

  it("returns org_pool when both org pool and bonus have enough credits", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    await seedAiCredits(t, orgId, { balance: 50, bonusCredits: 20 });

    const result = await t.query(internal.billing.guards.requireAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      creditsRequired: 10,
    });

    // org_pool first priority when org pool is sufficient
    expect(result.source).toBe("org_pool");
    expect(result.available).toBe(70);
  });

  it("throws INSUFFICIENT_CREDITS when total credits insufficient", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    await seedAiCredits(t, orgId, { balance: 3, bonusCredits: 2 });

    try {
      await t.query(internal.billing.guards.requireAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        creditsRequired: 10,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{
        code: string;
        available: number;
        required: number;
      }>(error);
      expect(data.code).toBe("INSUFFICIENT_CREDITS");
      expect(data.available).toBe(5);
      expect(data.required).toBe(10);
    }
  });

  it("throws SUBSCRIPTION_INACTIVE for non-active orgs", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "expired" });
    await seedAiCredits(t, orgId, { balance: 100 });

    try {
      await t.query(internal.billing.guards.requireAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        creditsRequired: 5,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("SUBSCRIPTION_INACTIVE");
    }
  });

  it("throws SUBSCRIPTION_INACTIVE for grace_period orgs (AI blocked)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "grace_period" });
    await seedAiCredits(t, orgId, { balance: 100 });

    try {
      await t.query(internal.billing.guards.requireAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        creditsRequired: 5,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("SUBSCRIPTION_INACTIVE");
    }
  });

  it("throws NO_CREDITS_RECORD when aiCredits not initialized", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    // No aiCredits seeded

    try {
      await t.query(internal.billing.guards.requireAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        creditsRequired: 5,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("NO_CREDITS_RECORD");
    }
  });

  it("throws ORG_NOT_FOUND for non-existent org in AI credits check", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(orgId as any);
    });

    try {
      await t.query(internal.billing.guards.requireAiCredits, {
        organizationId: orgId as any,
        userId: userId as any,
        creditsRequired: 5,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("ORG_NOT_FOUND");
    }
  });

  it("handles zero bonus credits (undefined) gracefully", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "active" });
    // Seed without bonusCredits (undefined)
    await seedAiCredits(t, orgId, { balance: 50 });

    const result = await t.query(internal.billing.guards.requireAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      creditsRequired: 10,
    });

    expect(result.source).toBe("org_pool");
    expect(result.available).toBe(50); // only balance, no bonus
  });

  it("allows trial orgs to use AI credits", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t, { status: "trial" });
    await seedAiCredits(t, orgId, { balance: 20 });

    const result = await t.query(internal.billing.guards.requireAiCredits, {
      organizationId: orgId as any,
      userId: userId as any,
      creditsRequired: 5,
    });

    expect(result.source).toBe("org_pool");
    expect(result.available).toBe(20);
  });
});

// ===========================================================================
// BILLING_ERRORS constants
// vi: "Hang so loi thanh toan" / en: "Billing error constants"
// ===========================================================================

describe("BILLING_ERRORS constants", () => {
  it("exports all required error codes", async () => {
    const { BILLING_ERRORS } = await import("./billing/errors");

    expect(BILLING_ERRORS.ORG_NOT_FOUND.code).toBe("ORG_NOT_FOUND");
    expect(BILLING_ERRORS.SUBSCRIPTION_INACTIVE.code).toBe(
      "SUBSCRIPTION_INACTIVE",
    );
    expect(BILLING_ERRORS.SUBSCRIPTION_GRACE_PERIOD.code).toBe(
      "SUBSCRIPTION_GRACE_PERIOD",
    );
    expect(BILLING_ERRORS.NO_CREDITS_RECORD.code).toBe("NO_CREDITS_RECORD");
    expect(BILLING_ERRORS.INSUFFICIENT_CREDITS.code).toBe(
      "INSUFFICIENT_CREDITS",
    );
  });

  it("includes bilingual messages (vi/en) for each error", async () => {
    const { BILLING_ERRORS } = await import("./billing/errors");

    for (const error of Object.values(BILLING_ERRORS)) {
      expect(error.message).toBeDefined();
      expect(error.messageVi).toBeDefined();
      expect(typeof error.message).toBe("string");
      expect(typeof error.messageVi).toBe("string");
    }
  });
});

// ===========================================================================
// withSubscriptionGuard helper
// vi: "Ham tien ich kiem tra dang ky" / en: "Subscription check helper"
// ===========================================================================

describe("withSubscriptionGuard helper", () => {
  it("returns org document for active subscriptions", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "active" });

    // Test via direct DB run since withSubscriptionGuard is a plain function
    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      const org = await withSubscriptionGuard(ctx as any, orgId as any);
      expect(org).toBeDefined();
      expect(org.name).toBe("Guard Test Org");
    });
  });

  it("returns org document for trial subscriptions", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "trial" });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      const org = await withSubscriptionGuard(ctx as any, orgId as any);
      expect(org.status).toBe("trial");
    });
  });

  it("throws ORG_NOT_FOUND for non-existent org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(orgId as any);
    });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      try {
        await withSubscriptionGuard(ctx as any, orgId as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<{ code: string }>;
        expect(convexError.data.code).toBe("ORG_NOT_FOUND");
      }
    });
  });

  it("throws SUBSCRIPTION_INACTIVE for expired org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "expired" });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      try {
        await withSubscriptionGuard(ctx as any, orgId as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<{
          code: string;
          status: string;
        }>;
        expect(convexError.data.code).toBe("SUBSCRIPTION_INACTIVE");
        expect(convexError.data.status).toBe("expired");
      }
    });
  });

  it("throws SUBSCRIPTION_INACTIVE for suspended org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "suspended" });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      try {
        await withSubscriptionGuard(ctx as any, orgId as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<{
          code: string;
          status: string;
        }>;
        expect(convexError.data.code).toBe("SUBSCRIPTION_INACTIVE");
        expect(convexError.data.status).toBe("suspended");
      }
    });
  });

  it("throws SUBSCRIPTION_INACTIVE for grace_period org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t, { status: "grace_period" });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      try {
        await withSubscriptionGuard(ctx as any, orgId as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<{
          code: string;
          status: string;
        }>;
        expect(convexError.data.code).toBe("SUBSCRIPTION_INACTIVE");
        expect(convexError.data.status).toBe("grace_period");
      }
    });
  });

  it("treats org with no status as active (full access)", async () => {
    const t = convexTest(schema, modules);
    let orgId: string = "";

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Legacy Org",
        slug: "legacy-org",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      const { withSubscriptionGuard } = await import("./billing/withGuard");
      const org = await withSubscriptionGuard(ctx as any, orgId as any);
      expect(org.name).toBe("Legacy Org");
    });
  });
});
