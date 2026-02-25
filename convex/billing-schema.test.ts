import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a base org + user for FK references */
async function seedBase(t: ReturnType<typeof convexTest>) {
  let orgId: string = "";
  let userId: string = "";

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Billing Test Org",
      slug: "billing-test-org",
      org_type: "hospital",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    userId = await ctx.db.insert("users", {
      name: "Billing Admin",
      email: "billing@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId };
}

// ===========================================================================
// AC1: organizations table has extended status union with grace_period and expired
// ===========================================================================

describe("AC1: organizations status field extension", () => {
  it("should accept grace_period status", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Grace Period Org",
        slug: "grace-period-org",
        org_type: "hospital",
        status: "grace_period",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const org = await ctx.db.get(orgId);
      expect(org).not.toBeNull();
      expect(org!.status).toBe("grace_period");
    });
  });

  it("should accept expired status", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Expired Org",
        slug: "expired-org",
        org_type: "hospital",
        status: "expired",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const org = await ctx.db.get(orgId);
      expect(org).not.toBeNull();
      expect(org!.status).toBe("expired");
    });
  });

  it("should still accept existing statuses (active, suspended, trial)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (const status of ["active", "suspended", "trial"] as const) {
        const orgId = await ctx.db.insert("organizations", {
          name: `${status} Org`,
          slug: `${status}-org`,
          org_type: "hospital",
          status,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        const org = await ctx.db.get(orgId);
        expect(org!.status).toBe(status);
      }
    });
  });
});

// ===========================================================================
// AC2: organizations table has all 7 new subscription fields
// ===========================================================================

describe("AC2: organizations subscription fields", () => {
  it("should accept all subscription fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const now = Date.now();
      const orgId = await ctx.db.insert("organizations", {
        name: "Subscribed Org",
        slug: "subscribed-org",
        org_type: "hospital",
        status: "active",
        subscriptionPlan: "professional",
        billingCycle: "monthly_6",
        subscriptionStartDate: now,
        subscriptionExpiresAt: now + 180 * 24 * 60 * 60 * 1000,
        gracePeriodEndsAt: now + 187 * 24 * 60 * 60 * 1000,
        maxStaffSeats: 50,
        maxEquipment: 500,
        createdAt: now,
        updatedAt: now,
      });
      const org = await ctx.db.get(orgId);
      expect(org).not.toBeNull();
      expect(org!.subscriptionPlan).toBe("professional");
      expect(org!.billingCycle).toBe("monthly_6");
      expect(org!.subscriptionStartDate).toBe(now);
      expect(org!.subscriptionExpiresAt).toBe(now + 180 * 24 * 60 * 60 * 1000);
      expect(org!.gracePeriodEndsAt).toBe(now + 187 * 24 * 60 * 60 * 1000);
      expect(org!.maxStaffSeats).toBe(50);
      expect(org!.maxEquipment).toBe(500);
    });
  });

  it("should accept all subscription plan values", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (const plan of ["starter", "professional", "enterprise", "trial"] as const) {
        const orgId = await ctx.db.insert("organizations", {
          name: `${plan} plan org`,
          slug: `${plan}-plan-org`,
          org_type: "hospital",
          subscriptionPlan: plan,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        const org = await ctx.db.get(orgId);
        expect(org!.subscriptionPlan).toBe(plan);
      }
    });
  });

  it("should accept all billing cycle values", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (const cycle of ["monthly_3", "monthly_6", "monthly_12"] as const) {
        const orgId = await ctx.db.insert("organizations", {
          name: `${cycle} cycle org`,
          slug: `${cycle}-cycle-org`,
          org_type: "hospital",
          billingCycle: cycle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        const org = await ctx.db.get(orgId);
        expect(org!.billingCycle).toBe(cycle);
      }
    });
  });

  it("should allow subscription fields to be optional", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "No Subscription Org",
        slug: "no-sub-org",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const org = await ctx.db.get(orgId);
      expect(org!.subscriptionPlan).toBeUndefined();
      expect(org!.billingCycle).toBeUndefined();
      expect(org!.subscriptionStartDate).toBeUndefined();
      expect(org!.subscriptionExpiresAt).toBeUndefined();
      expect(org!.gracePeriodEndsAt).toBeUndefined();
      expect(org!.maxStaffSeats).toBeUndefined();
      expect(org!.maxEquipment).toBeUndefined();
    });
  });
});

// ===========================================================================
// AC3: subscriptions table with all fields + 4 indexes
// ===========================================================================

describe("AC3: subscriptions table", () => {
  it("should insert a full subscription record", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const subId = await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "professional",
        billingCycle: "monthly_6",
        startDate: now,
        endDate: now + 180 * 24 * 60 * 60 * 1000,
        amountVnd: 5000000,
        status: "active",
        monthlyAiCredits: 200,
        activatedBy: userId as any,
        activatedAt: now,
        notes: "Initial subscription",
        createdAt: now,
        updatedAt: now,
      });

      const sub = await ctx.db.get(subId);
      expect(sub).not.toBeNull();
      expect(sub!.plan).toBe("professional");
      expect(sub!.billingCycle).toBe("monthly_6");
      expect(sub!.amountVnd).toBe(5000000);
      expect(sub!.monthlyAiCredits).toBe(200);
      expect(sub!.status).toBe("active");
    });
  });

  it("should accept all plan types", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const plan of ["starter", "professional", "enterprise", "trial"] as const) {
        const subId = await ctx.db.insert("subscriptions", {
          organizationId: orgId as any,
          plan,
          billingCycle: "monthly_3",
          startDate: now,
          endDate: now + 90 * 24 * 60 * 60 * 1000,
          amountVnd: 1000000,
          status: "active",
          monthlyAiCredits: 50,
          createdAt: now,
          updatedAt: now,
        });
        const sub = await ctx.db.get(subId);
        expect(sub!.plan).toBe(plan);
      }
    });
  });

  it("should accept trial_14d billing cycle", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const subId = await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "trial",
        billingCycle: "trial_14d",
        startDate: now,
        endDate: now + 14 * 24 * 60 * 60 * 1000,
        amountVnd: 0,
        status: "active",
        monthlyAiCredits: 20,
        createdAt: now,
        updatedAt: now,
      });
      const sub = await ctx.db.get(subId);
      expect(sub!.billingCycle).toBe("trial_14d");
    });
  });

  it("should accept all status values", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const status of ["active", "expired", "cancelled", "renewed"] as const) {
        const subId = await ctx.db.insert("subscriptions", {
          organizationId: orgId as any,
          plan: "starter",
          billingCycle: "monthly_3",
          startDate: now,
          endDate: now + 90 * 24 * 60 * 60 * 1000,
          amountVnd: 1000000,
          status,
          monthlyAiCredits: 50,
          cancelledAt: status === "cancelled" ? now : undefined,
          cancelReason: status === "cancelled" ? "No longer needed" : undefined,
          createdAt: now,
          updatedAt: now,
        });
        const sub = await ctx.db.get(subId);
        expect(sub!.status).toBe(status);
      }
    });
  });

  it("should query by_organizationId index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: now,
        endDate: now + 90 * 24 * 60 * 60 * 1000,
        amountVnd: 1000000,
        status: "active",
        monthlyAiCredits: 50,
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("subscriptions")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId as any))
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_organizationId_status compound index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: now,
        endDate: now + 90 * 24 * 60 * 60 * 1000,
        amountVnd: 1000000,
        status: "active",
        monthlyAiCredits: 50,
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("subscriptions")
        .withIndex("by_organizationId_status", (q) =>
          q.eq("organizationId", orgId as any).eq("status", "active"),
        )
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_status index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: now,
        endDate: now + 90 * 24 * 60 * 60 * 1000,
        amountVnd: 1000000,
        status: "expired",
        monthlyAiCredits: 50,
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", "expired"))
        .collect();
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should query by_endDate index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const endDate = now + 90 * 24 * 60 * 60 * 1000;
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: now,
        endDate,
        amountVnd: 1000000,
        status: "active",
        monthlyAiCredits: 50,
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("subscriptions")
        .withIndex("by_endDate", (q) => q.eq("endDate", endDate))
        .collect();
      expect(results.length).toBe(1);
    });
  });
});

// ===========================================================================
// AC4: payments table with all fields + 5 indexes
// ===========================================================================

describe("AC4: payments table", () => {
  it("should insert a full payment record", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const paymentId = await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 5000000,
        paymentMethod: "bank_transfer",
        bankReference: "VCB-123456",
        bankName: "Vietcombank",
        transferDate: now,
        invoiceNumber: "INV-2026-001",
        status: "pending",
        paymentType: "subscription_new",
        notes: "First payment",
        createdAt: now,
        updatedAt: now,
      });

      const payment = await ctx.db.get(paymentId);
      expect(payment).not.toBeNull();
      expect(payment!.amountVnd).toBe(5000000);
      expect(payment!.paymentMethod).toBe("bank_transfer");
      expect(payment!.bankReference).toBe("VCB-123456");
      expect(payment!.status).toBe("pending");
      expect(payment!.paymentType).toBe("subscription_new");
    });
  });

  it("should accept all payment method values", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const method of ["bank_transfer", "cash", "momo", "vnpay", "other"] as const) {
        const paymentId = await ctx.db.insert("payments", {
          organizationId: orgId as any,
          amountVnd: 1000000,
          paymentMethod: method,
          status: "pending",
          paymentType: "subscription_new",
          createdAt: now,
          updatedAt: now,
        });
        const payment = await ctx.db.get(paymentId);
        expect(payment!.paymentMethod).toBe(method);
      }
    });
  });

  it("should accept all status values", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const status of ["pending", "confirmed", "rejected", "refunded"] as const) {
        const paymentId = await ctx.db.insert("payments", {
          organizationId: orgId as any,
          amountVnd: 1000000,
          paymentMethod: "bank_transfer",
          status,
          paymentType: "subscription_new",
          createdAt: now,
          updatedAt: now,
        });
        const payment = await ctx.db.get(paymentId);
        expect(payment!.status).toBe(status);
      }
    });
  });

  it("should accept all payment type values", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const paymentType of [
        "subscription_new",
        "subscription_renewal",
        "ai_credits",
        "upgrade",
        "other",
      ] as const) {
        const paymentId = await ctx.db.insert("payments", {
          organizationId: orgId as any,
          amountVnd: 1000000,
          paymentMethod: "bank_transfer",
          status: "pending",
          paymentType,
          createdAt: now,
          updatedAt: now,
        });
        const payment = await ctx.db.get(paymentId);
        expect(payment!.paymentType).toBe(paymentType);
      }
    });
  });

  it("should query by_organizationId index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        status: "pending",
        paymentType: "subscription_new",
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("payments")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId as any))
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_status index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        status: "confirmed",
        paymentType: "subscription_new",
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", "confirmed"))
        .collect();
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should query by_invoiceNumber index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        invoiceNumber: "INV-2026-TEST",
        status: "pending",
        paymentType: "subscription_new",
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("payments")
        .withIndex("by_invoiceNumber", (q) => q.eq("invoiceNumber", "INV-2026-TEST"))
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_organizationId_status compound index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        status: "pending",
        paymentType: "subscription_new",
        createdAt: now,
        updatedAt: now,
      });
      const results = await ctx.db
        .query("payments")
        .withIndex("by_organizationId_status", (q) =>
          q.eq("organizationId", orgId as any).eq("status", "pending"),
        )
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should link to subscriptionId (optional FK)", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const subId = await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: now,
        endDate: now + 90 * 24 * 60 * 60 * 1000,
        amountVnd: 1000000,
        status: "active",
        monthlyAiCredits: 50,
        createdAt: now,
        updatedAt: now,
      });

      const paymentId = await ctx.db.insert("payments", {
        organizationId: orgId as any,
        subscriptionId: subId,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        status: "confirmed",
        paymentType: "subscription_new",
        createdAt: now,
        updatedAt: now,
      });

      const payment = await ctx.db.get(paymentId);
      expect(payment!.subscriptionId).toBe(subId);

      // Verify by_subscriptionId index
      const results = await ctx.db
        .query("payments")
        .withIndex("by_subscriptionId", (q) => q.eq("subscriptionId", subId))
        .collect();
      expect(results.length).toBe(1);
    });
  });
});

// ===========================================================================
// AC5: aiCredits table with all fields + 1 index
// ===========================================================================

describe("AC5: aiCredits table", () => {
  it("should insert a full AI credit balance record", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const creditId = await ctx.db.insert("aiCredits", {
        organizationId: orgId as any,
        balance: 200,
        lifetimeCreditsGranted: 400,
        lifetimeCreditsUsed: 200,
        monthlyIncluded: 200,
        monthlyUsed: 50,
        monthlyResetAt: now + 30 * 24 * 60 * 60 * 1000,
        bonusCredits: 100,
        updatedAt: now,
      });

      const credit = await ctx.db.get(creditId);
      expect(credit).not.toBeNull();
      expect(credit!.balance).toBe(200);
      expect(credit!.lifetimeCreditsGranted).toBe(400);
      expect(credit!.lifetimeCreditsUsed).toBe(200);
      expect(credit!.monthlyIncluded).toBe(200);
      expect(credit!.monthlyUsed).toBe(50);
      expect(credit!.bonusCredits).toBe(100);
    });
  });

  it("should allow bonusCredits to be optional", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const creditId = await ctx.db.insert("aiCredits", {
        organizationId: orgId as any,
        balance: 50,
        lifetimeCreditsGranted: 50,
        lifetimeCreditsUsed: 0,
        monthlyIncluded: 50,
        monthlyUsed: 0,
        monthlyResetAt: now + 30 * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });

      const credit = await ctx.db.get(creditId);
      expect(credit!.bonusCredits).toBeUndefined();
    });
  });

  it("should query by_organizationId index", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCredits", {
        organizationId: orgId as any,
        balance: 100,
        lifetimeCreditsGranted: 100,
        lifetimeCreditsUsed: 0,
        monthlyIncluded: 100,
        monthlyUsed: 0,
        monthlyResetAt: now + 30 * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });

      const results = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId as any))
        .collect();
      expect(results.length).toBe(1);
    });
  });
});

// ===========================================================================
// AC6: aiCreditConsumption table with all fields + 4 indexes
// ===========================================================================

describe("AC6: aiCreditConsumption table", () => {
  it("should insert a full consumption audit record", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const logId = await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
        creditsUsed: 5,
        creditSource: "org_pool",
        promptTokens: 1500,
        completionTokens: 800,
        claudeModel: "claude-haiku-4-5",
        apiCostUsd: 0.05,
        entityType: "equipment",
        entityId: "eq_12345",
        status: "completed",
        createdAt: now,
      });

      const log = await ctx.db.get(logId);
      expect(log).not.toBeNull();
      expect(log!.featureId).toBe("equipment_diagnosis");
      expect(log!.creditsUsed).toBe(5);
      expect(log!.creditSource).toBe("org_pool");
      expect(log!.promptTokens).toBe(1500);
      expect(log!.completionTokens).toBe(800);
      expect(log!.claudeModel).toBe("claude-haiku-4-5");
      expect(log!.status).toBe("completed");
    });
  });

  it("should accept all credit source values", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const source of ["org_pool", "personal", "bonus"] as const) {
        const logId = await ctx.db.insert("aiCreditConsumption", {
          organizationId: orgId as any,
          userId: userId as any,
          featureId: "test_feature",
          creditsUsed: 1,
          creditSource: source,
          status: "completed",
          createdAt: now,
        });
        const log = await ctx.db.get(logId);
        expect(log!.creditSource).toBe(source);
      }
    });
  });

  it("should accept all status values", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      for (const status of ["pending", "completed", "failed", "refunded"] as const) {
        const logId = await ctx.db.insert("aiCreditConsumption", {
          organizationId: orgId as any,
          userId: userId as any,
          featureId: "test_feature",
          creditsUsed: 1,
          creditSource: "org_pool",
          status,
          errorMessage: status === "failed" ? "API timeout" : undefined,
          createdAt: now,
        });
        const log = await ctx.db.get(logId);
        expect(log!.status).toBe(status);
      }
    });
  });

  it("should query by_organizationId_createdAt index", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "test_feature",
        creditsUsed: 1,
        creditSource: "org_pool",
        status: "completed",
        createdAt: now,
      });

      const results = await ctx.db
        .query("aiCreditConsumption")
        .withIndex("by_organizationId_createdAt", (q) =>
          q.eq("organizationId", orgId as any),
        )
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_userId_createdAt index", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "test_feature",
        creditsUsed: 1,
        creditSource: "org_pool",
        status: "completed",
        createdAt: now,
      });

      const results = await ctx.db
        .query("aiCreditConsumption")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId as any))
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_organizationId_featureId index", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "equipment_diagnosis",
        creditsUsed: 5,
        creditSource: "org_pool",
        status: "completed",
        createdAt: now,
      });

      const results = await ctx.db
        .query("aiCreditConsumption")
        .withIndex("by_organizationId_featureId", (q) =>
          q.eq("organizationId", orgId as any).eq("featureId", "equipment_diagnosis"),
        )
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query by_status index", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedBase(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCreditConsumption", {
        organizationId: orgId as any,
        userId: userId as any,
        featureId: "test_feature",
        creditsUsed: 1,
        creditSource: "org_pool",
        status: "failed",
        errorMessage: "API error",
        createdAt: now,
      });

      const results = await ctx.db
        .query("aiCreditConsumption")
        .withIndex("by_status", (q) => q.eq("status", "failed"))
        .collect();
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ===========================================================================
// AC7: aiCreditPacks table with all fields + 1 index
// ===========================================================================

describe("AC7: aiCreditPacks table", () => {
  it("should insert a full credit pack record", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const packId = await ctx.db.insert("aiCreditPacks", {
        name: "50 Credits",
        credits: 50,
        priceVnd: 500000,
        isActive: true,
        description: "Goi 50 credit AI / 50 AI credit pack",
        createdAt: now,
        updatedAt: now,
      });

      const pack = await ctx.db.get(packId);
      expect(pack).not.toBeNull();
      expect(pack!.name).toBe("50 Credits");
      expect(pack!.credits).toBe(50);
      expect(pack!.priceVnd).toBe(500000);
      expect(pack!.isActive).toBe(true);
      expect(pack!.description).toBe("Goi 50 credit AI / 50 AI credit pack");
    });
  });

  it("should allow description to be optional", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const packId = await ctx.db.insert("aiCreditPacks", {
        name: "100 Credits",
        credits: 100,
        priceVnd: 900000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const pack = await ctx.db.get(packId);
      expect(pack!.description).toBeUndefined();
    });
  });

  it("should query by_isActive index", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("aiCreditPacks", {
        name: "Active Pack",
        credits: 50,
        priceVnd: 500000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("aiCreditPacks", {
        name: "Inactive Pack",
        credits: 25,
        priceVnd: 250000,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });

      const activeResults = await ctx.db
        .query("aiCreditPacks")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect();
      expect(activeResults.length).toBe(1);
      expect(activeResults[0].name).toBe("Active Pack");

      const inactiveResults = await ctx.db
        .query("aiCreditPacks")
        .withIndex("by_isActive", (q) => q.eq("isActive", false))
        .collect();
      expect(inactiveResults.length).toBe(1);
      expect(inactiveResults[0].name).toBe("Inactive Pack");
    });
  });
});

// ===========================================================================
// AC10: No breaking changes to existing organization queries
// ===========================================================================

describe("AC10: backward compatibility", () => {
  it("should still create orgs without any billing fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Legacy Org",
        slug: "legacy-org",
        org_type: "provider",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const org = await ctx.db.get(orgId);
      expect(org).not.toBeNull();
      expect(org!.name).toBe("Legacy Org");
      expect(org!.org_type).toBe("provider");
    });
  });

  it("should query organizations by_status index with new values", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("organizations", {
        name: "Grace Org",
        slug: "grace-org",
        org_type: "hospital",
        status: "grace_period",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const results = await ctx.db
        .query("organizations")
        .withIndex("by_status", (q) => q.eq("status", "grace_period"))
        .collect();
      expect(results.length).toBe(1);
    });
  });

  it("should query organizations by_subscriptionExpiresAt index", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await ctx.db.insert("organizations", {
        name: "Expiring Org",
        slug: "expiring-org",
        org_type: "hospital",
        subscriptionExpiresAt: expiresAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const results = await ctx.db
        .query("organizations")
        .withIndex("by_subscriptionExpiresAt", (q) =>
          q.eq("subscriptionExpiresAt", expiresAt),
        )
        .collect();
      expect(results.length).toBe(1);
    });
  });
});
