/**
 * Integration tests for dispute query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn tranh chấp" / en: "Dispute query integration tests"
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
  org_type: "hospital" | "provider" = "hospital",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "staff@spmet.edu.vn",
  name = "Staff User",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name,
      email,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedEquipment(
  t: ReturnType<typeof convexTest>,
  orgId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const catId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Thiết bị chẩn đoán",
      nameEn: "Diagnostic Equipment",
      organizationId: orgId as any,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.insert("equipment", {
      nameVi: "Máy ECG",
      nameEn: "ECG Machine",
      categoryId: catId,
      organizationId: orgId as any,
      status: "available",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedServiceRequest(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  equipId: string,
  userId: string,
  status: "pending" | "in_progress" | "completed" | "cancelled" | "disputed" = "completed",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipId as any,
      requestedBy: userId as any,
      type: "repair",
      priority: "medium",
      status,
      descriptionVi: "Máy cần sửa chữa",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedDispute(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  serviceRequestId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("disputes", {
      organizationId: orgId as any,
      serviceRequestId: serviceRequestId as any,
      raisedBy: userId as any,
      status: "open",
      type: "quality",
      descriptionVi: "Chất lượng dịch vụ không đạt",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedDisputeMessage(
  t: ReturnType<typeof convexTest>,
  disputeId: string,
  userId: string,
  content = "Tin nhắn kiểm tra",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("disputeMessages", {
      disputeId: disputeId as any,
      authorId: userId as any,
      contentVi: content,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// disputes.listByHospital
// ===========================================================================
describe("disputes.listByHospital", () => {
  it("test_listByHospital_returns_org_scoped_disputes", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t, "Hospital A");
    const otherOrgId = await seedOrganization(t, "Hospital B");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);

    await seedDispute(t, orgId, srId, userId);
    await seedDispute(t, orgId, srId, userId, { type: "pricing" });

    const otherEquipId = await seedEquipment(t, otherOrgId);
    const otherSrId = await seedServiceRequest(t, otherOrgId, otherEquipId, userId);
    await seedDispute(t, otherOrgId, otherSrId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    const result = await asOrg.query(api.disputes.listByHospital, {
      organizationId: orgId as any,
    });

    expect(result).toHaveLength(2);
    expect(result.every((d: any) => d.organizationId === orgId)).toBe(true);
  });

  it("test_listByHospital_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);

    await seedDispute(t, orgId, srId, userId, { status: "open" });
    await seedDispute(t, orgId, srId, userId, { status: "investigating" });
    await seedDispute(t, orgId, srId, userId, { status: "resolved" });

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const openDisputes = await asOrg.query(api.disputes.listByHospital, {
      organizationId: orgId as any,
      status: "open",
    });
    expect(openDisputes).toHaveLength(1);
    expect(openDisputes[0].status).toBe("open");

    const allDisputes = await asOrg.query(api.disputes.listByHospital, {
      organizationId: orgId as any,
    });
    expect(allDisputes).toHaveLength(3);
  });

  it("test_listByHospital_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    await expect(
      t.query(api.disputes.listByHospital, {
        organizationId: orgId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// disputes.getById
// ===========================================================================
describe("disputes.getById", () => {
  it("test_getById_returns_enriched_dispute", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    const result = await asOrg.query(api.disputes.getById, {
      id: disputeId as any,
    }) as any;

    expect(result).not.toBeNull();
    expect(result!._id).toBe(disputeId);
    expect(result!.serviceRequest).not.toBeNull();
    expect(result!.serviceRequest.descriptionVi).toBe("Máy cần sửa chữa");
    expect(result!.equipmentName).toBeTruthy();
    expect(result!.organizationName).toBeTruthy();
  });

  it("test_getById_returns_null_when_not_found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    // Create a dispute then delete it so we have a valid ID format that no longer exists
    const disputeId = await seedDispute(t, orgId, srId, userId);
    await t.run(async (ctx) => ctx.db.delete(disputeId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    const result = await asOrg.query(api.disputes.getById, {
      id: disputeId as any,
    });

    expect(result).toBeNull();
  });

  it("test_getById_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    await expect(
      t.query(api.disputes.getById, {
        id: disputeId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// disputes.getMessages
// ===========================================================================
describe("disputes.getMessages", () => {
  it("test_getMessages_returns_messages_for_dispute", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    await seedDisputeMessage(t, disputeId, userId, "Tin nhắn 1");
    await seedDisputeMessage(t, disputeId, userId, "Tin nhắn 2");
    await seedDisputeMessage(t, disputeId, userId, "Tin nhắn 3");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    const messages = await asOrg.query(api.disputes.getMessages, {
      disputeId: disputeId as any,
    }) as any[];

    expect(messages).toHaveLength(3);
    expect(messages[0].contentVi).toBe("Tin nhắn 1");
  });

  it("test_getMessages_returns_empty_when_no_messages", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    const messages = await asOrg.query(api.disputes.getMessages, {
      disputeId: disputeId as any,
    });

    expect(messages).toHaveLength(0);
  });

  it("test_getMessages_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    await expect(
      t.query(api.disputes.getMessages, {
        disputeId: disputeId as any,
      }),
    ).rejects.toThrow();
  });
});
