/**
 * Admin subscription management tests.
 *
 * Tests for convex/billing/admin.ts functions:
 * - listOrganizationSubscriptions (query)
 * - getOrganizationBillingDetail (query)
 * - activateSubscription (mutation)
 * - extendSubscription (mutation)
 * - suspendSubscription (mutation)
 * - reactivateSubscription (mutation)
 *
 * vi: "Kiem tra quan ly dang ky admin"
 * en: "Admin subscription management tests"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */

import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse ConvexError data (convex-test serializes as JSON string) */
function parseErrorData<T>(error: unknown): T {
  const convexError = error as ConvexError<unknown>;
  const raw = convexError.data;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

/** Seed base org + admin user for tests, returns admin identity context */
async function seedBaseOrg(
  t: ReturnType<typeof convexTest>,
  overrides: {
    name?: string;
    status?: "active" | "suspended" | "trial" | "grace_period" | "expired";
    subscriptionPlan?: "starter" | "professional" | "enterprise" | "trial";
    subscriptionExpiresAt?: number;
    gracePeriodEndsAt?: number;
    billingCycle?: "monthly_3" | "monthly_6" | "monthly_12";
    maxStaffSeats?: number;
    maxEquipment?: number;
  } = {},
) {
  let orgId: string = "";
  let adminUserId: string = "";

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: overrides.name ?? "Test Hospital",
      slug: `test-hospital-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      org_type: "hospital",
      status: overrides.status ?? "trial",
      subscriptionPlan: overrides.subscriptionPlan,
      billingCycle: overrides.billingCycle,
      subscriptionExpiresAt: overrides.subscriptionExpiresAt,
      gracePeriodEndsAt: overrides.gracePeriodEndsAt,
      maxStaffSeats: overrides.maxStaffSeats,
      maxEquipment: overrides.maxEquipment,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Check if admin user already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", "admin@medilink.vn"))
      .first();

    if (!existingAdmin) {
      adminUserId = await ctx.db.insert("users", {
        name: "Admin User",
        email: "admin@medilink.vn",
        platformRole: "platform_admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      adminUserId = existingAdmin._id;
    }
  });

  return { orgId, adminUserId };
}

/** Create admin identity for withIdentity */
function asAdmin(t: ReturnType<typeof convexTest>, adminUserId: string) {
  return t.withIdentity({
    subject: adminUserId,
    email: "admin@medilink.vn",
    platformRole: "platform_admin",
  });
}

/** Create non-admin identity for withIdentity */
function asNonAdmin(t: ReturnType<typeof convexTest>) {
  return t.withIdentity({
    subject: "regular-user-id",
    email: "user@spmet.edu.vn",
    platformRole: null,
  });
}

/** Create a confirmed payment record for an org */
async function seedPayment(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  amountVnd: number = 10_000_000,
) {
  let paymentId: string = "";

  await t.run(async (ctx) => {
    paymentId = await ctx.db.insert("payments", {
      organizationId: orgId as any,
      amountVnd,
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentType: "subscription_new",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { paymentId };
}

// ===========================================================================
// listOrganizationSubscriptions
// ===========================================================================

describe("listOrganizationSubscriptions", () => {
  it("returns all hospital orgs for platform admin", async () => {
    const t = convexTest(schema, modules);
    const { adminUserId } = await seedBaseOrg(t, {
      name: "Hospital A",
      status: "active",
    });
    await seedBaseOrg(t, { name: "Hospital B", status: "trial" });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.listOrganizationSubscriptions,
      {},
    );

    expect(result.organizations.length).toBe(2);
    expect(result.total).toBe(2);
  });

  it("filters by status correctly", async () => {
    const t = convexTest(schema, modules);
    const { adminUserId } = await seedBaseOrg(t, {
      name: "Active Org",
      status: "active",
    });
    await seedBaseOrg(t, { name: "Trial Org", status: "trial" });
    await seedBaseOrg(t, { name: "Expired Org", status: "expired" });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.listOrganizationSubscriptions,
      { statusFilter: "active" },
    );

    expect(result.organizations.length).toBe(1);
    expect(result.organizations[0]!.name).toBe("Active Org");
  });

  it("searches by organization name (case-insensitive)", async () => {
    const t = convexTest(schema, modules);
    const { adminUserId } = await seedBaseOrg(t, { name: "SPMET Hospital" });
    await seedBaseOrg(t, { name: "Cho Ray Hospital" });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.listOrganizationSubscriptions,
      { searchQuery: "spmet" },
    );

    expect(result.organizations.length).toBe(1);
    expect(result.organizations[0]!.name).toBe("SPMET Hospital");
  });

  it("rejects non-admin users with FORBIDDEN", async () => {
    const t = convexTest(schema, modules);
    await seedBaseOrg(t);

    const nonAdmin = asNonAdmin(t);

    try {
      await nonAdmin.query(api.billing.admin.listOrganizationSubscriptions, {});
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("FORBIDDEN");
    }
  });

  it("rejects unauthenticated users", async () => {
    const t = convexTest(schema, modules);

    try {
      await t.query(api.billing.admin.listOrganizationSubscriptions, {});
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("UNAUTHENTICATED");
    }
  });
});

// ===========================================================================
// getOrganizationBillingDetail
// ===========================================================================

describe("getOrganizationBillingDetail", () => {
  it("returns org details with subscription info", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      name: "Detail Hospital",
      status: "active",
      subscriptionPlan: "professional",
      billingCycle: "monthly_6",
      subscriptionExpiresAt: Date.now() + 6 * MONTH_MS,
      maxStaffSeats: 50,
      maxEquipment: -1,
    });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.getOrganizationBillingDetail,
      { organizationId: orgId as any },
    );

    expect(result).not.toBeNull();
    expect(result!.organization.name).toBe("Detail Hospital");
    expect(result!.organization.subscriptionPlan).toBe("professional");
    expect(result!.staffCount).toBe(0);
    expect(result!.equipmentCount).toBe(0);
  });

  it("includes subscription history", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "active" });

    // Seed subscription history
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "trial",
        billingCycle: "trial_14d",
        startDate: Date.now() - 30 * DAY_MS,
        endDate: Date.now() - 16 * DAY_MS,
        amountVnd: 0,
        status: "expired",
        monthlyAiCredits: 20,
        createdAt: Date.now() - 30 * DAY_MS,
        updatedAt: Date.now() - 16 * DAY_MS,
      });
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "professional",
        billingCycle: "monthly_6",
        startDate: Date.now() - 14 * DAY_MS,
        endDate: Date.now() + 6 * MONTH_MS,
        amountVnd: 20_000_000,
        status: "active",
        monthlyAiCredits: 200,
        createdAt: Date.now() - 14 * DAY_MS,
        updatedAt: Date.now() - 14 * DAY_MS,
      });
    });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.getOrganizationBillingDetail,
      { organizationId: orgId as any },
    );

    expect(result!.subscriptionHistory.length).toBe(2);
  });

  it("returns null for non-existent org", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t);
    // Delete the org
    await t.run(async (ctx) => {
      await ctx.db.delete(orgId as any);
    });

    const admin = asAdmin(t, adminUserId);
    const result = await admin.query(
      api.billing.admin.getOrganizationBillingDetail,
      { organizationId: orgId as any },
    );

    expect(result).toBeNull();
  });
});

// ===========================================================================
// activateSubscription
// ===========================================================================

describe("activateSubscription", () => {
  it("creates subscription and updates org for starter plan", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });
    const { paymentId } = await seedPayment(t, orgId, 5_000_000);

    const admin = asAdmin(t, adminUserId);
    const result = await admin.mutation(
      api.billing.admin.activateSubscription,
      {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        paymentId: paymentId as any,
        amountVnd: 5_000_000,
      },
    );

    expect(result.subscriptionId).toBeDefined();

    // Verify org was updated
    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
      expect(org!.subscriptionPlan).toBe("starter");
      expect(org!.billingCycle).toBe("monthly_3");
      expect(org!.maxStaffSeats).toBe(10);
      expect(org!.maxEquipment).toBe(100);
      expect(org!.subscriptionStartDate).toBeDefined();
      expect(org!.subscriptionExpiresAt).toBeDefined();
    });
  });

  it("sets correct plan limits for professional plan", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });
    const { paymentId } = await seedPayment(t, orgId, 20_000_000);

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.activateSubscription, {
      organizationId: orgId as any,
      plan: "professional",
      billingCycle: "monthly_6",
      paymentId: paymentId as any,
      amountVnd: 20_000_000,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.maxStaffSeats).toBe(50);
      expect(org!.maxEquipment).toBe(-1); // unlimited
    });
  });

  it("sets correct plan limits for enterprise plan", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });
    const { paymentId } = await seedPayment(t, orgId, 50_000_000);

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.activateSubscription, {
      organizationId: orgId as any,
      plan: "enterprise",
      billingCycle: "monthly_12",
      paymentId: paymentId as any,
      amountVnd: 50_000_000,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.maxStaffSeats).toBe(-1); // unlimited
      expect(org!.maxEquipment).toBe(-1); // unlimited
    });
  });

  it("calculates correct expiry for 3-month billing cycle", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });
    const { paymentId } = await seedPayment(t, orgId);

    const beforeActivation = Date.now();

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.activateSubscription, {
      organizationId: orgId as any,
      plan: "starter",
      billingCycle: "monthly_3",
      paymentId: paymentId as any,
      amountVnd: 5_000_000,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      const expectedMinExpiry = beforeActivation + 3 * MONTH_MS;
      // Allow some tolerance for test execution time
      expect(org!.subscriptionExpiresAt).toBeGreaterThanOrEqual(
        expectedMinExpiry - 5000,
      );
    });
  });

  it("initializes AI credits for the plan", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });
    const { paymentId } = await seedPayment(t, orgId);

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.activateSubscription, {
      organizationId: orgId as any,
      plan: "professional",
      billingCycle: "monthly_6",
      paymentId: paymentId as any,
      amountVnd: 20_000_000,
    });

    await t.run(async (ctx) => {
      const credits = await ctx.db
        .query("aiCredits")
        .withIndex("by_organizationId", (q: any) =>
          q.eq("organizationId", orgId as any),
        )
        .unique();
      expect(credits).not.toBeNull();
      expect(credits!.balance).toBe(200); // professional = 200
      expect(credits!.monthlyIncluded).toBe(200);
      expect(credits!.monthlyUsed).toBe(0);
    });
  });

  it("rejects non-admin users", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedBaseOrg(t);
    const { paymentId } = await seedPayment(t, orgId);

    const nonAdmin = asNonAdmin(t);

    try {
      await nonAdmin.mutation(api.billing.admin.activateSubscription, {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        paymentId: paymentId as any,
        amountVnd: 5_000_000,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("FORBIDDEN");
    }
  });

  it("rejects unconfirmed payment", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "trial" });

    let paymentId: string = "";
    await t.run(async (ctx) => {
      paymentId = await ctx.db.insert("payments", {
        organizationId: orgId as any,
        amountVnd: 5_000_000,
        paymentMethod: "bank_transfer",
        status: "pending", // NOT confirmed
        paymentType: "subscription_new",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const admin = asAdmin(t, adminUserId);
    try {
      await admin.mutation(api.billing.admin.activateSubscription, {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        paymentId: paymentId as any,
        amountVnd: 5_000_000,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("PAYMENT_NOT_CONFIRMED");
    }
  });
});

// ===========================================================================
// extendSubscription
// ===========================================================================

describe("extendSubscription", () => {
  it("extends from current expiresAt (not from today)", async () => {
    const t = convexTest(schema, modules);
    const futureExpiry = Date.now() + 30 * DAY_MS; // 30 days from now
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "active",
      subscriptionPlan: "professional",
      billingCycle: "monthly_6",
      subscriptionExpiresAt: futureExpiry,
    });
    const { paymentId } = await seedPayment(t, orgId, 20_000_000);

    // Seed an active subscription record
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "professional",
        billingCycle: "monthly_6",
        startDate: Date.now() - 5 * MONTH_MS,
        endDate: futureExpiry,
        amountVnd: 20_000_000,
        status: "active",
        monthlyAiCredits: 200,
        createdAt: Date.now() - 5 * MONTH_MS,
        updatedAt: Date.now() - 5 * MONTH_MS,
      });
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.extendSubscription, {
      organizationId: orgId as any,
      billingCycle: "monthly_6",
      paymentId: paymentId as any,
      amountVnd: 20_000_000,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      // Should extend from CURRENT expiresAt, not from today
      // 30 days remaining + 6 months extension
      const expectedMinExpiry = futureExpiry + 6 * MONTH_MS;
      expect(org!.subscriptionExpiresAt).toBeGreaterThanOrEqual(
        expectedMinExpiry - 5000,
      );
    });
  });

  it("transitions grace_period back to active", async () => {
    const t = convexTest(schema, modules);
    const expiredAt = Date.now() - 3 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "grace_period",
      subscriptionPlan: "starter",
      subscriptionExpiresAt: expiredAt,
      gracePeriodEndsAt: expiredAt + 7 * DAY_MS,
    });
    const { paymentId } = await seedPayment(t, orgId);

    // Seed an expired subscription record
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: Date.now() - 3 * MONTH_MS,
        endDate: expiredAt,
        amountVnd: 5_000_000,
        status: "expired",
        monthlyAiCredits: 50,
        createdAt: Date.now() - 3 * MONTH_MS,
        updatedAt: Date.now(),
      });
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.extendSubscription, {
      organizationId: orgId as any,
      billingCycle: "monthly_3",
      paymentId: paymentId as any,
      amountVnd: 5_000_000,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
      expect(org!.gracePeriodEndsAt).toBeUndefined();
    });
  });

  it("marks previous active subscription as renewed", async () => {
    const t = convexTest(schema, modules);
    const futureExpiry = Date.now() + 30 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "active",
      subscriptionPlan: "starter",
      subscriptionExpiresAt: futureExpiry,
    });
    const { paymentId } = await seedPayment(t, orgId);

    let subId: string = "";
    await t.run(async (ctx) => {
      subId = await ctx.db.insert("subscriptions", {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        startDate: Date.now() - 60 * DAY_MS,
        endDate: futureExpiry,
        amountVnd: 5_000_000,
        status: "active",
        monthlyAiCredits: 50,
        createdAt: Date.now() - 60 * DAY_MS,
        updatedAt: Date.now(),
      });
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.extendSubscription, {
      organizationId: orgId as any,
      billingCycle: "monthly_3",
      paymentId: paymentId as any,
      amountVnd: 5_000_000,
    });

    await t.run(async (ctx) => {
      const oldSub = await ctx.db.get(subId as any);
      expect(oldSub!.status).toBe("renewed");
    });
  });
});

// ===========================================================================
// suspendSubscription
// ===========================================================================

describe("suspendSubscription", () => {
  it("suspends an active organization", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "active" });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.suspendSubscription, {
      organizationId: orgId as any,
      reason: "Non-payment",
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("suspended");
    });
  });

  it("writes audit log entry", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "active" });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.suspendSubscription, {
      organizationId: orgId as any,
      reason: "Violation of terms",
    });

    await t.run(async (ctx) => {
      const logs = await ctx.db
        .query("auditLog")
        .filter((q: any) => q.eq(q.field("organizationId"), orgId as any))
        .collect();
      const suspendLog = logs.find(
        (l: any) => l.action === "billing.subscription_suspended",
      );
      expect(suspendLog).toBeDefined();
      expect(suspendLog!.newValues).toMatchObject({
        status: "suspended",
        reason: "Violation of terms",
      });
    });
  });

  it("rejects suspending non-existent org", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(orgId as any);
    });

    const admin = asAdmin(t, adminUserId);
    try {
      await admin.mutation(api.billing.admin.suspendSubscription, {
        organizationId: orgId as any,
        reason: "Test",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("ORG_NOT_FOUND");
    }
  });
});

// ===========================================================================
// reactivateSubscription
// ===========================================================================

describe("reactivateSubscription", () => {
  it("reactivates a suspended organization to active", async () => {
    const t = convexTest(schema, modules);
    const futureExpiry = Date.now() + 30 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "suspended",
      subscriptionExpiresAt: futureExpiry,
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.reactivateSubscription, {
      organizationId: orgId as any,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
    });
  });

  it("rejects reactivating org with no valid subscription period", async () => {
    const t = convexTest(schema, modules);
    const pastExpiry = Date.now() - 30 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "suspended",
      subscriptionExpiresAt: pastExpiry,
    });

    const admin = asAdmin(t, adminUserId);
    try {
      await admin.mutation(api.billing.admin.reactivateSubscription, {
        organizationId: orgId as any,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = parseErrorData<{ code: string }>(error);
      expect(data.code).toBe("SUBSCRIPTION_EXPIRED");
    }
  });

  it("clears gracePeriodEndsAt when reactivating", async () => {
    const t = convexTest(schema, modules);
    const futureGrace = Date.now() + 3 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "grace_period",
      subscriptionExpiresAt: Date.now() - 4 * DAY_MS,
      gracePeriodEndsAt: futureGrace,
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.reactivateSubscription, {
      organizationId: orgId as any,
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
      expect(org!.gracePeriodEndsAt).toBeUndefined();
    });
  });

  it("writes audit log entry", async () => {
    const t = convexTest(schema, modules);
    const futureExpiry = Date.now() + 30 * DAY_MS;
    const { orgId, adminUserId } = await seedBaseOrg(t, {
      status: "suspended",
      subscriptionExpiresAt: futureExpiry,
    });

    const admin = asAdmin(t, adminUserId);
    await admin.mutation(api.billing.admin.reactivateSubscription, {
      organizationId: orgId as any,
    });

    await t.run(async (ctx) => {
      const logs = await ctx.db
        .query("auditLog")
        .filter((q: any) => q.eq(q.field("organizationId"), orgId as any))
        .collect();
      const reactivateLog = logs.find(
        (l: any) => l.action === "billing.subscription_reactivated",
      );
      expect(reactivateLog).toBeDefined();
    });
  });
});

// ===========================================================================
// Status transition validation
// ===========================================================================

describe("status transitions", () => {
  it("rejects invalid transition: expired org cannot be reactivated without payment", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "expired" });

    const admin = asAdmin(t, adminUserId);
    try {
      await admin.mutation(api.billing.admin.reactivateSubscription, {
        organizationId: orgId as any,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
    }
  });

  it("allows activateSubscription on expired org (with new payment)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, adminUserId } = await seedBaseOrg(t, { status: "expired" });
    const { paymentId } = await seedPayment(t, orgId);

    const admin = asAdmin(t, adminUserId);
    const result = await admin.mutation(
      api.billing.admin.activateSubscription,
      {
        organizationId: orgId as any,
        plan: "starter",
        billingCycle: "monthly_3",
        paymentId: paymentId as any,
        amountVnd: 5_000_000,
      },
    );

    expect(result.subscriptionId).toBeDefined();

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
    });
  });
});
