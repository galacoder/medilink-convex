/**
 * Integration tests for payment mutation and query functions.
 * Uses convex-test to exercise against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các hàm thanh toán" / en: "Payment integration tests"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedOrganization(
  t: ReturnType<typeof convexTest>,
  name = "SPMET Hospital",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type: "hospital" as const,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "staff@spmet.edu.vn",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: "Staff User",
      email,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedPayment(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  userId: string,
  status: "pending" | "completed" | "failed" | "refunded" = "pending",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("payment", {
      organizationId: orgId as any,
      paidBy: userId as any,
      amount: 500000,
      currency: "VND",
      status,
      descriptionVi: "Phí dịch vụ sửa chữa thiết bị",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// payment.create
// ===========================================================================
describe("payment.create", () => {
  it("test_create_inserts_payment_with_pending_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    const paymentId = await asOrg.mutation(api.payment.create, {
      amount: 250000,
      currency: "VND",
      descriptionVi: "Thanh toán phí bảo trì",
    });

    const payment = (await t.run(async (ctx) =>
      ctx.db.get(paymentId as any),
    )) as any;
    expect(payment).not.toBeNull();
    expect(payment!.status).toBe("pending");
    expect(payment!.organizationId).toBe(orgId);
    expect(payment!.amount).toBe(250000);
    expect(payment!.currency).toBe("VND");
    expect(payment!.createdAt).toBeGreaterThanOrEqual(before);
  });

  it("test_create_rejects_zero_amount", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.payment.create, {
        amount: 0,
        currency: "VND",
        descriptionVi: "Thanh toán không hợp lệ",
      }),
    ).rejects.toThrow();
  });

  it("test_create_rejects_negative_amount", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.payment.create, {
        amount: -100,
        currency: "VND",
        descriptionVi: "Thanh toán âm",
      }),
    ).rejects.toThrow();
  });

  it("test_create_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.payment.create, {
        amount: 100000,
        currency: "VND",
        descriptionVi: "Thanh toán",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// payment.updateStatus
// ===========================================================================
describe("payment.updateStatus", () => {
  it("test_updateStatus_pending_to_completed_is_valid", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "pending");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    await asOrg.mutation(api.payment.updateStatus, {
      paymentId: paymentId as any,
      status: "completed",
      paidAt: before,
    });

    const payment = (await t.run(async (ctx) =>
      ctx.db.get(paymentId as any),
    )) as any;
    expect(payment!.status).toBe("completed");
    expect(payment!.paidAt).toBe(before);
  });

  it("test_updateStatus_pending_to_failed_is_valid", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "pending");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.payment.updateStatus, {
      paymentId: paymentId as any,
      status: "failed",
    });

    const payment = (await t.run(async (ctx) =>
      ctx.db.get(paymentId as any),
    )) as any;
    expect(payment!.status).toBe("failed");
  });

  it("test_updateStatus_non_pending_throws", async () => {
    // WHY: Completed/failed/refunded are terminal states. Once a payment
    // reaches a terminal state, its status must not change.
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.payment.updateStatus, {
        paymentId: paymentId as any,
        status: "refunded",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_throws_for_nonexistent_payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "pending");
    await t.run(async (ctx) => ctx.db.delete(paymentId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.payment.updateStatus, {
        paymentId: paymentId as any,
        status: "completed",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_rejects_cross_org_access", async () => {
    // WHY: Without org verification any authenticated user can modify payment
    // records from other organizations — a CRITICAL cross-org write vulnerability.
    const t = convexTest(schema, modules);
    const ownerOrgId = await seedOrganization(t, "Hospital A");
    const attackerOrgId = await seedOrganization(t, "Unrelated Org B");
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, ownerOrgId, userId, "pending");

    const asAttacker = t.withIdentity({
      organizationId: attackerOrgId,
      subject: userId,
    });

    await expect(
      asAttacker.mutation(api.payment.updateStatus, {
        paymentId: paymentId as any,
        status: "completed",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// payment.list
// ===========================================================================
describe("payment.list", () => {
  it("test_list_returns_org_payments", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    await seedPayment(t, orgId, userId, "pending");
    await seedPayment(t, orgId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const payments = await asOrg.query(api.payment.list, {});
    expect(payments.length).toBe(2);
  });

  it("test_list_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    await seedPayment(t, orgId, userId, "pending");
    await seedPayment(t, orgId, userId, "pending");
    await seedPayment(t, orgId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const pending = await asOrg.query(api.payment.list, { status: "pending" });
    expect(pending.length).toBe(2);
    for (const p of pending) {
      expect((p as any).status).toBe("pending");
    }
  });

  it("test_list_excludes_other_org_payments", async () => {
    const t = convexTest(schema, modules);
    const orgA = await seedOrganization(t, "Hospital A");
    const orgB = await seedOrganization(t, "Hospital B");
    const userId = await seedUser(t);

    await seedPayment(t, orgA, userId, "pending");
    await seedPayment(t, orgB, userId, "pending");

    const asOrgA = t.withIdentity({ organizationId: orgA, subject: userId });

    const payments = await asOrgA.query(api.payment.list, {});
    expect(payments.length).toBe(1);
  });
});

// ===========================================================================
// payment.getById
// ===========================================================================
describe("payment.getById", () => {
  it("test_getById_returns_payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "pending");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const payment = (await asOrg.query(api.payment.getById, {
      paymentId: paymentId as any,
    })) as any;

    expect(payment).not.toBeNull();
    expect(payment!.status).toBe("pending");
    expect(payment!.amount).toBe(500000);
  });

  it("test_getById_returns_null_for_nonexistent_payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, orgId, userId, "pending");
    await t.run(async (ctx) => ctx.db.delete(paymentId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const result = await asOrg.query(api.payment.getById, {
      paymentId: paymentId as any,
    });
    expect(result).toBeNull();
  });

  it("test_getById_rejects_cross_org_access", async () => {
    const t = convexTest(schema, modules);
    const ownerOrgId = await seedOrganization(t, "Hospital A");
    const attackerOrgId = await seedOrganization(t, "Unrelated Org B");
    const userId = await seedUser(t);
    const paymentId = await seedPayment(t, ownerOrgId, userId, "pending");

    const asAttacker = t.withIdentity({
      organizationId: attackerOrgId,
      subject: userId,
    });

    await expect(
      asAttacker.query(api.payment.getById, {
        paymentId: paymentId as any,
      }),
    ).rejects.toThrow();
  });
});
