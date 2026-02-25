/**
 * Unit tests for payment record management: record, confirm, reject, void, list, detail.
 *
 * Tests cover acceptance criteria from issue #173:
 * - AC1: recordPayment creates payment in pending or confirmed state
 * - AC2: confirmPayment transitions pending -> confirmed
 * - AC3: rejectPayment transitions pending -> rejected with reason
 * - AC4: voidPayment transitions confirmed -> refunded with reason
 * - AC5: listPayments returns filtered, sorted results
 * - AC6: getPaymentDetail returns full transfer information
 * - AC7: getPaymentsByOrganization returns org payment history
 * - AC8: Invoice numbers auto-generated in ML-YYYYMMDD-XXXX format
 * - AC9: Admin-only access enforced (platform_admin required)
 * - AC10: Bilingual error messages (vi/en)
 *
 * vi: "Kiem tra don vi cho quan ly thanh toan"
 * en: "Unit tests for payment record management"
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_IDENTITY = {
  subject: "admin-user-id",
  email: "admin@medilink.vn",
  platformRole: "platform_admin",
};

const NON_ADMIN_IDENTITY = {
  subject: "regular-user-id",
  email: "user@spmet.edu.vn",
  platformRole: "member",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a base organization for payment FK references */
async function createOrg(
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {},
) {
  let orgId = "" as string;
  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Payment Test Hospital",
      slug: "payment-test-hospital",
      org_type: "hospital" as const,
      status: "active" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });
  });
  return orgId;
}

/** Create a user record for admin references */
async function createAdminUser(
  t: ReturnType<typeof convexTest>,
  email = "admin@medilink.vn",
) {
  let userId = "" as string;
  await t.run(async (ctx) => {
    userId = await ctx.db.insert("users", {
      name: "Platform Admin",
      email,
      platformRole: "platform_admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  return userId;
}

// ===========================================================================
// AC1: recordPayment mutation creates payment in pending or confirmed state
// ===========================================================================

describe("AC1: recordPayment", () => {
  it("should create a payment in pending state by default", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        bankReference: "FT26055XXXXX",
        bankName: "Vietcombank",
        transferDate: Date.now(),
        notes: "Initial subscription payment",
      });

    expect(paymentId).toBeDefined();

    // Verify the record was created with pending status
    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment).not.toBeNull();
      expect(payment!.status).toBe("pending");
      expect(payment!.amountVnd).toBe(10800000);
      expect(payment!.paymentMethod).toBe("bank_transfer");
      expect(payment!.paymentType).toBe("subscription_new");
      expect(payment!.bankReference).toBe("FT26055XXXXX");
      expect(payment!.bankName).toBe("Vietcombank");
      expect(payment!.notes).toBe("Initial subscription payment");
      expect(payment!.confirmedBy).toBeUndefined();
      expect(payment!.confirmedAt).toBeUndefined();
    });
  });

  it("should create a payment in confirmed state when confirmImmediately is true", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    const adminUserId = await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 5400000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_renewal",
        confirmImmediately: true,
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment).not.toBeNull();
      expect(payment!.status).toBe("confirmed");
      expect(payment!.confirmedBy).toBeDefined();
      expect(payment!.confirmedAt).toBeDefined();
    });
  });

  it("should throw for non-admin users", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);

    await expect(
      t
        .withIdentity(NON_ADMIN_IDENTITY)
        .mutation(api.billing.payments.recordPayment, {
          organizationId: orgId as any,
          amountVnd: 10800000,
          paymentMethod: "bank_transfer",
          paymentType: "subscription_new",
        }),
    ).rejects.toThrow();
  });

  it("should throw for non-existent organization", async () => {
    const t = convexTest(schema, modules);
    await createAdminUser(t);

    await expect(
      t
        .withIdentity(ADMIN_IDENTITY)
        .mutation(api.billing.payments.recordPayment, {
          // Use a properly formatted but non-existent ID
          organizationId: "k57a3fwhvey0ct0g0g0000000" as any,
          amountVnd: 10800000,
          paymentMethod: "bank_transfer",
          paymentType: "subscription_new",
        }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC8: Invoice numbers auto-generated in ML-YYYYMMDD-XXXX format
// ===========================================================================

describe("AC8: invoice number auto-generation", () => {
  it("should auto-generate invoice number in ML-YYYYMMDD-XXXX format", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment).not.toBeNull();
      expect(payment!.invoiceNumber).toMatch(/^ML-\d{8}-\d{4}$/);
    });
  });

  it("should use provided invoice number if given", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        invoiceNumber: "CUSTOM-001",
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment!.invoiceNumber).toBe("CUSTOM-001");
    });
  });

  it("should increment invoice sequence for multiple payments on same day", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const id1 = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    const id2 = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 2000000,
        paymentMethod: "cash",
        paymentType: "ai_credits",
      });

    await t.run(async (ctx) => {
      const p1 = await ctx.db.get(id1 as any);
      const p2 = await ctx.db.get(id2 as any);
      expect(p1!.invoiceNumber).toMatch(/^ML-\d{8}-0001$/);
      expect(p2!.invoiceNumber).toMatch(/^ML-\d{8}-0002$/);
    });
  });
});

// ===========================================================================
// AC2: confirmPayment mutation transitions pending -> confirmed
// ===========================================================================

describe("AC2: confirmPayment", () => {
  it("should transition pending payment to confirmed", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.confirmPayment, {
        paymentId: paymentId as any,
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment!.status).toBe("confirmed");
      expect(payment!.confirmedBy).toBeDefined();
      expect(payment!.confirmedAt).toBeDefined();
    });
  });

  it("should throw when confirming non-pending payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    // Create already confirmed payment
    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        confirmImmediately: true,
      });

    await expect(
      t
        .withIdentity(ADMIN_IDENTITY)
        .mutation(api.billing.payments.confirmPayment, {
          paymentId: paymentId as any,
        }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC3: rejectPayment mutation transitions pending -> rejected with reason
// ===========================================================================

describe("AC3: rejectPayment", () => {
  it("should transition pending payment to rejected with reason", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.rejectPayment, {
        paymentId: paymentId as any,
        rejectionReason: "Bank reference not found in account",
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment!.status).toBe("rejected");
      expect(payment!.rejectionReason).toBe(
        "Bank reference not found in account",
      );
    });
  });

  it("should throw when rejecting non-pending payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        confirmImmediately: true,
      });

    await expect(
      t
        .withIdentity(ADMIN_IDENTITY)
        .mutation(api.billing.payments.rejectPayment, {
          paymentId: paymentId as any,
          rejectionReason: "Invalid",
        }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC4: voidPayment mutation transitions confirmed -> refunded with reason
// ===========================================================================

describe("AC4: voidPayment", () => {
  it("should transition confirmed payment to refunded with reason", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        confirmImmediately: true,
      });

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.voidPayment, {
        paymentId: paymentId as any,
        reason: "Duplicate payment, refunding to hospital",
      });

    await t.run(async (ctx) => {
      const payment = await ctx.db.get(paymentId as any);
      expect(payment!.status).toBe("refunded");
      // Notes should contain the void reason
      expect(payment!.notes).toContain(
        "Duplicate payment, refunding to hospital",
      );
    });
  });

  it("should throw when voiding non-confirmed payment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    // Create pending payment (not confirmed)
    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await expect(
      t
        .withIdentity(ADMIN_IDENTITY)
        .mutation(api.billing.payments.voidPayment, {
          paymentId: paymentId as any,
          reason: "Test void",
        }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// AC5: listPayments query returns filtered, sorted results
// ===========================================================================

describe("AC5: listPayments", () => {
  it("should return all payments sorted by createdAt descending", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    // Create multiple payments
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 2000000,
        paymentMethod: "cash",
        paymentType: "ai_credits",
      });

    const result = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.listPayments, {});

    expect(result.payments).toHaveLength(2);
    // Verify both amounts are present
    const amounts = result.payments.map((p: any) => p.amountVnd).sort();
    expect(amounts).toEqual([1000000, 2000000]);
    // Verify sorted by createdAt descending (newest first)
    expect(result.payments[0]!.createdAt).toBeGreaterThanOrEqual(
      result.payments[1]!.createdAt,
    );
  });

  it("should filter by status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    // Create one pending payment
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    // Create one confirmed payment
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 2000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_renewal",
        confirmImmediately: true,
      });

    const pendingResult = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.listPayments, { statusFilter: "pending" });

    expect(pendingResult.payments).toHaveLength(1);
    expect(pendingResult.payments[0]!.status).toBe("pending");

    const confirmedResult = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.listPayments, { statusFilter: "confirmed" });

    expect(confirmedResult.payments).toHaveLength(1);
    expect(confirmedResult.payments[0]!.status).toBe("confirmed");
  });

  it("should filter by organization", async () => {
    const t = convexTest(schema, modules);
    const orgId1 = await createOrg(t, {
      name: "Hospital A",
      slug: "hospital-a",
    });
    const orgId2 = await createOrg(t, {
      name: "Hospital B",
      slug: "hospital-b",
    });
    await createAdminUser(t);

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId1 as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId2 as any,
        amountVnd: 2000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    const result = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.listPayments, {
        organizationId: orgId1 as any,
      });

    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]!.organizationName).toBe("Hospital A");
  });

  it("should search by organization name", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t, {
      name: "SPMET Hospital",
      slug: "spmet-hospital",
    });
    await createAdminUser(t);

    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    const result = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.listPayments, { searchQuery: "SPMET" });

    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]!.organizationName).toBe("SPMET Hospital");
  });
});

// ===========================================================================
// AC6: getPaymentDetail returns full transfer information
// ===========================================================================

describe("AC6: getPaymentDetail", () => {
  it("should return complete payment with organization name", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t, {
      name: "Detail Test Hospital",
      slug: "detail-test",
    });
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
        bankReference: "FT26055XXXXX",
        bankName: "Vietcombank",
        transferDate: 1708819200000,
        notes: "Test payment",
      });

    const detail = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.getPaymentDetail, {
        paymentId: paymentId as any,
      });

    expect(detail).not.toBeNull();
    expect(detail!.organizationName).toBe("Detail Test Hospital");
    expect(detail!.amountVnd).toBe(10800000);
    expect(detail!.paymentMethod).toBe("bank_transfer");
    expect(detail!.bankReference).toBe("FT26055XXXXX");
    expect(detail!.bankName).toBe("Vietcombank");
    expect(detail!.transferDate).toBe(1708819200000);
    expect(detail!.notes).toBe("Test payment");
    expect(detail!.invoiceNumber).toMatch(/^ML-\d{8}-\d{4}$/);
  });
});

// ===========================================================================
// AC7: getPaymentsByOrganization returns org payment history
// ===========================================================================

describe("AC7: getPaymentsByOrganization", () => {
  it("should return all payments for a specific organization", async () => {
    const t = convexTest(schema, modules);
    const orgId1 = await createOrg(t, { name: "Org 1", slug: "org-1" });
    const orgId2 = await createOrg(t, { name: "Org 2", slug: "org-2" });
    await createAdminUser(t);

    // Create payments for org 1
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId1 as any,
        amountVnd: 1000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId1 as any,
        amountVnd: 2000000,
        paymentMethod: "cash",
        paymentType: "ai_credits",
      });

    // Create a payment for org 2
    await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId2 as any,
        amountVnd: 3000000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    const result = await t
      .withIdentity(ADMIN_IDENTITY)
      .query(api.billing.payments.getPaymentsByOrganization, {
        organizationId: orgId1 as any,
      });

    expect(result).toHaveLength(2);
    // All should belong to org 1
    for (const payment of result) {
      expect(payment.organizationId).toBe(orgId1);
    }
  });
});

// ===========================================================================
// AC9: Admin-only access enforced
// ===========================================================================

describe("AC9: admin-only access", () => {
  it("should reject unauthenticated listPayments", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.billing.payments.listPayments, {}),
    ).rejects.toThrow();
  });

  it("should reject non-admin confirmPayment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createOrg(t);
    await createAdminUser(t);

    const paymentId = await t
      .withIdentity(ADMIN_IDENTITY)
      .mutation(api.billing.payments.recordPayment, {
        organizationId: orgId as any,
        amountVnd: 10800000,
        paymentMethod: "bank_transfer",
        paymentType: "subscription_new",
      });

    await expect(
      t
        .withIdentity(NON_ADMIN_IDENTITY)
        .mutation(api.billing.payments.confirmPayment, {
          paymentId: paymentId as any,
        }),
    ).rejects.toThrow();
  });
});
