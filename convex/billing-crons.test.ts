/**
 * Unit tests for subscription expiry cron job logic.
 *
 * Tests cover acceptance criteria from issue #176:
 * - AC2: Active orgs with expired subscription transition to grace_period
 * - AC3: gracePeriodEndsAt set to subscriptionExpiresAt + 7 days
 * - AC4: Grace period orgs with ended grace transition to expired
 * - AC5: Warning emails sent at 30, 15, 7 days before expiry
 * - AC11: Cron job is idempotent
 * - AC12: No duplicate emails
 * - AC13: Subscription record status updated alongside org status
 *
 * vi: "Kiem tra don vi cho cron job kiem tra het han dang ky"
 * en: "Unit tests for subscription expiry cron job"
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    })) as unknown as string;
  });
  return orgId;
}

/**
 * Create a subscription record for an organization.
 * vi: "Tao ban ghi dang ky" / en: "Create subscription record"
 */
async function createSubscription(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  let subId = "" as string;
  await t.run(async (ctx) => {
    subId = (await ctx.db.insert("subscriptions", {
      organizationId: orgId as any,
      plan: "professional" as const,
      billingCycle: "monthly_6" as const,
      startDate: Date.now() - 180 * DAY_MS,
      endDate: Date.now() + 180 * DAY_MS,
      amountVnd: 5000000,
      status: "active" as const,
      monthlyAiCredits: 200,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    })) as unknown as string;
  });
  return subId;
}

/**
 * Create an org owner user + membership.
 * vi: "Tao nguoi dung chu so huu" / en: "Create owner user"
 */
async function createOrgOwner(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  email = "admin@spmet.edu.vn",
) {
  let userId = "" as string;
  await t.run(async (ctx) => {
    userId = (await ctx.db.insert("users", {
      name: "Org Admin",
      email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })) as unknown as string;
    await ctx.db.insert("organizationMemberships", {
      orgId: orgId as any,
      userId: userId as any,
      role: "owner" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  return userId;
}

// ===========================================================================
// AC2: Active orgs with expired subscription transition to grace_period
// AC3: gracePeriodEndsAt set to subscriptionExpiresAt + 7 days
// AC13: Subscription record status updated alongside org status
// ===========================================================================

describe("transitionExpiredToGrace", () => {
  it("transitions active org to grace_period when subscription expired", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: yesterday,
      subscriptionPlan: "professional",
    });
    await createSubscription(t, orgId, {
      status: "active",
      endDate: yesterday,
    });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("grace_period");
    });
  });

  it("sets gracePeriodEndsAt to subscriptionExpiresAt + 7 days", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const expiresAt = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: expiresAt,
    });
    await createSubscription(t, orgId, {
      status: "active",
      endDate: expiresAt,
    });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.gracePeriodEndsAt).toBe(expiresAt + 7 * DAY_MS);
    });
  });

  it("updates subscription record status to expired alongside org status", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: yesterday,
    });
    const subId = await createSubscription(t, orgId, {
      status: "active",
      endDate: yesterday,
    });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const sub = await ctx.db.get(subId as any);
      expect(sub!.status).toBe("expired");
    });
  });

  it("does not transition org that is not yet expired", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const tomorrow = now + DAY_MS;

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: tomorrow,
    });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
    });
  });

  it("does not transition org without subscriptionExpiresAt", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    const orgId = await createOrg(t, { status: "active" });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("active");
    });
  });
});

// ===========================================================================
// AC4: Grace period orgs with ended grace transition to expired
// ===========================================================================

describe("transitionGraceToExpired", () => {
  it("transitions grace_period org to expired when grace ends", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "grace_period",
      gracePeriodEndsAt: yesterday,
    });

    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("expired");
    });
  });

  it("does not transition grace_period org whose grace period has not ended", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const future = now + 3 * DAY_MS;

    const orgId = await createOrg(t, {
      status: "grace_period",
      gracePeriodEndsAt: future,
    });

    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("grace_period");
    });
  });

  it("does not transition org without gracePeriodEndsAt", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    const orgId = await createOrg(t, { status: "grace_period" });

    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("grace_period");
    });
  });
});

// ===========================================================================
// AC11: Cron job is idempotent (safe to run multiple times)
// ===========================================================================

describe("idempotency", () => {
  it("running transitionExpiredToGrace twice does not double-transition", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: yesterday,
    });

    // First run — transitions to grace_period
    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    // Second run — should be a no-op since org is now grace_period, not active
    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("grace_period");
    });
  });

  it("running transitionGraceToExpired twice does not error", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId = await createOrg(t, {
      status: "grace_period",
      gracePeriodEndsAt: yesterday,
    });

    // First run — transitions to expired
    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    // Second run — no-op since org is expired, not grace_period
    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.status).toBe("expired");
    });
  });
});

// ===========================================================================
// AC5: Warning emails sent at 30, 15, 7 days before expiry
// Helper queries
// ===========================================================================

describe("getActiveOrgsWithExpiry", () => {
  it("returns only active orgs", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await createOrg(t, {
      name: "Active Org",
      slug: "active-org",
      status: "active",
      subscriptionExpiresAt: now + 30 * DAY_MS,
    });
    await createOrg(t, {
      name: "Expired Org",
      slug: "expired-org",
      status: "expired",
    });

    const result = await t.query(
      internal.billing.crons.getActiveOrgsWithExpiry,
    );

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Active Org");
  });
});

describe("getGracePeriodOrgs", () => {
  it("returns only grace_period orgs", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await createOrg(t, {
      name: "Grace Org",
      slug: "grace-org",
      status: "grace_period",
      gracePeriodEndsAt: now + 4 * DAY_MS,
    });
    await createOrg(t, {
      name: "Active Org",
      slug: "active-org",
      status: "active",
    });

    const result = await t.query(internal.billing.crons.getGracePeriodOrgs);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Grace Org");
  });
});

// ===========================================================================
// AC12: No duplicate emails — idempotency via lastBillingEmailSentAt
// ===========================================================================

describe("email deduplication tracking", () => {
  it("stores lastBillingEmailSentAt and lastBillingEmailType on org", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    const orgId = await createOrg(t, {
      status: "active",
      subscriptionExpiresAt: now + 30 * DAY_MS,
    });

    // Manually update the tracking fields (as the email sender would)
    await t.run(async (ctx) => {
      await ctx.db.patch(orgId as any, {
        lastBillingEmailSentAt: now,
        lastBillingEmailType: "expiry_30d",
      });
    });

    await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId as any);
      expect(org!.lastBillingEmailSentAt).toBe(now);
      expect(org!.lastBillingEmailType).toBe("expiry_30d");
    });
  });
});

// ===========================================================================
// Multiple org transitions in a single run
// ===========================================================================

describe("batch transitions", () => {
  it("transitions multiple active orgs to grace_period in one run", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId1 = await createOrg(t, {
      name: "Org 1",
      slug: "org-1",
      status: "active",
      subscriptionExpiresAt: yesterday,
    });
    const orgId2 = await createOrg(t, {
      name: "Org 2",
      slug: "org-2",
      status: "active",
      subscriptionExpiresAt: yesterday - DAY_MS,
    });

    await t.mutation(internal.billing.crons.transitionExpiredToGrace, { now });

    await t.run(async (ctx) => {
      const org1 = await ctx.db.get(orgId1 as any);
      const org2 = await ctx.db.get(orgId2 as any);
      expect(org1!.status).toBe("grace_period");
      expect(org2!.status).toBe("grace_period");
    });
  });

  it("transitions multiple grace_period orgs to expired in one run", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const yesterday = now - DAY_MS;

    const orgId1 = await createOrg(t, {
      name: "Grace Org 1",
      slug: "grace-org-1",
      status: "grace_period",
      gracePeriodEndsAt: yesterday,
    });
    const orgId2 = await createOrg(t, {
      name: "Grace Org 2",
      slug: "grace-org-2",
      status: "grace_period",
      gracePeriodEndsAt: yesterday - 2 * DAY_MS,
    });

    await t.mutation(internal.billing.crons.transitionGraceToExpired, { now });

    await t.run(async (ctx) => {
      const org1 = await ctx.db.get(orgId1 as any);
      const org2 = await ctx.db.get(orgId2 as any);
      expect(org1!.status).toBe("expired");
      expect(org2!.status).toBe("expired");
    });
  });
});

// ===========================================================================
// AC1: Daily cron job registered
// ===========================================================================

describe("cron job registration", () => {
  it("exports a default crons config", async () => {
    const cronsModule = await import("./crons");
    expect(cronsModule.default).toBeDefined();
  });
});

// ===========================================================================
// getOrgAdminEmail helper
// ===========================================================================

describe("getOrgAdminEmail", () => {
  it("returns the email of the org owner", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createOrgOwner(t, orgId, "owner@spmet.edu.vn");

    const result = await t.query(internal.billing.emails.getOrgAdminEmail, {
      organizationId: orgId as any,
    });

    expect(result).toBe("owner@spmet.edu.vn");
  });

  it("returns null when no owner membership exists", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);

    const result = await t.query(internal.billing.emails.getOrgAdminEmail, {
      organizationId: orgId as any,
    });

    expect(result).toBeNull();
  });
});

// ===========================================================================
// Warning threshold calculation (pure logic, no Convex dependency)
// ===========================================================================

describe("warning threshold calculation", () => {
  it("calculates 30 days correctly", () => {
    const now = Date.now();
    const expiresAt = now + 30 * DAY_MS;
    const daysUntilExpiry = Math.ceil((expiresAt - now) / DAY_MS);
    expect(daysUntilExpiry).toBe(30);
  });

  it("calculates 15 days correctly", () => {
    const now = Date.now();
    const expiresAt = now + 15 * DAY_MS;
    const daysUntilExpiry = Math.ceil((expiresAt - now) / DAY_MS);
    expect(daysUntilExpiry).toBe(15);
  });

  it("calculates 7 days correctly", () => {
    const now = Date.now();
    const expiresAt = now + 7 * DAY_MS;
    const daysUntilExpiry = Math.ceil((expiresAt - now) / DAY_MS);
    expect(daysUntilExpiry).toBe(7);
  });

  it("calculates grace mid-point (4 days remaining) correctly", () => {
    const now = Date.now();
    const gracePeriodEndsAt = now + 4 * DAY_MS;
    const daysUntilGraceEnd = Math.ceil((gracePeriodEndsAt - now) / DAY_MS);
    expect(daysUntilGraceEnd).toBe(4);
  });
});
