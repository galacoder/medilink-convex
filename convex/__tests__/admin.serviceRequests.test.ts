/**
 * Integration tests for platform admin service request query and mutation functions.
 * Uses convex-test to exercise functions against an in-memory Convex backend.
 *
 * Cross-tenant: No organizationId filter — platform admin sees ALL orgs.
 *
 * vi: "Kiểm tra yêu cầu dịch vụ quản trị nền tảng" / en: "Platform admin service request tests"
 */
import { ConvexError } from "convex/values";
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

async function seedPlatformAdmin(
  t: ReturnType<typeof convexTest>,
  email = "admin@sangletech.com",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: "Platform Admin",
      email,
      platformRole: "platform_admin",
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

async function seedProvider(
  t: ReturnType<typeof convexTest>,
  orgId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("providers", {
      organizationId: orgId as any,
      nameVi: "Công ty Sửa chữa Thiết bị",
      nameEn: "Equipment Repair Co",
      status: "active",
      verificationStatus: "verified",
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
  status: "pending" | "quoted" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed" = "pending",
  assignedProviderId?: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipId as any,
      requestedBy: userId as any,
      assignedProviderId: assignedProviderId ? (assignedProviderId as any) : undefined,
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
  status: "open" | "investigating" | "resolved" | "closed" | "escalated" = "open",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("disputes", {
      organizationId: orgId as any,
      serviceRequestId: serviceRequestId as any,
      raisedBy: userId as any,
      status,
      type: "quality",
      descriptionVi: "Chất lượng dịch vụ không đạt yêu cầu của bệnh viện",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// admin/serviceRequests.listAllServiceRequests
// ===========================================================================
describe("admin/serviceRequests.listAllServiceRequests", () => {
  it("test_listAllServiceRequests_returns_cross_tenant_data", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);

    // Create two separate hospital orgs
    const hospital1Id = await seedOrganization(t, "Hospital Alpha", "hospital");
    const hospital2Id = await seedOrganization(t, "Hospital Beta", "hospital");
    const userId = await seedUser(t);

    const equip1Id = await seedEquipment(t, hospital1Id);
    const equip2Id = await seedEquipment(t, hospital2Id);

    await seedServiceRequest(t, hospital1Id, equip1Id, userId, "pending");
    await seedServiceRequest(t, hospital1Id, equip1Id, userId, "in_progress");
    await seedServiceRequest(t, hospital2Id, equip2Id, userId, "completed");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listAllServiceRequests, {});

    expect(result).toHaveLength(3);
  });

  it("test_listAllServiceRequests_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);

    await seedServiceRequest(t, orgId, equipId, userId, "pending");
    await seedServiceRequest(t, orgId, equipId, userId, "completed");
    await seedServiceRequest(t, orgId, equipId, userId, "in_progress");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listAllServiceRequests, {
      status: "pending",
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending");
  });

  it("test_listAllServiceRequests_enriches_with_hospital_name", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t, "SPMET Hospital Alpha");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);

    await seedServiceRequest(t, orgId, equipId, userId);

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listAllServiceRequests, {});

    expect(result[0].hospitalName).toBe("SPMET Hospital Alpha");
  });

  it("test_listAllServiceRequests_requires_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    await seedServiceRequest(t, orgId, equipId, userId);

    // Regular user (not platform_admin) — should throw
    const asUser = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asUser.query(api.admin.serviceRequests.listAllServiceRequests, {}),
    ).rejects.toThrow(ConvexError);
  });

  it("test_listAllServiceRequests_bottleneck_flag_for_stale_requests", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);

    // Insert a stale pending request (created 8 days ago)
    const staleSr = await t.run(async (ctx) => {
      const staleTs = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      return ctx.db.insert("serviceRequests", {
        organizationId: orgId as any,
        equipmentId: equipId as any,
        requestedBy: userId as any,
        type: "repair",
        priority: "medium",
        status: "pending",
        descriptionVi: "Yêu cầu cũ",
        createdAt: staleTs,
        updatedAt: staleTs,
      });
    });

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listAllServiceRequests, {});

    const staleResult = result.find((r: any) => r._id === staleSr);
    expect(staleResult?.isBottleneck).toBe(true);
  });
});

// ===========================================================================
// admin/serviceRequests.listEscalatedDisputes
// ===========================================================================
describe("admin/serviceRequests.listEscalatedDisputes", () => {
  it("test_listEscalatedDisputes_returns_only_escalated", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "disputed");

    await seedDispute(t, orgId, srId, userId, "escalated");
    await seedDispute(t, orgId, srId, userId, "open"); // non-escalated
    await seedDispute(t, orgId, srId, userId, "resolved"); // non-escalated

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listEscalatedDisputes, {});

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("escalated");
  });

  it("test_listEscalatedDisputes_cross_tenant_all_orgs", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);

    const org1Id = await seedOrganization(t, "Hospital One");
    const org2Id = await seedOrganization(t, "Hospital Two");
    const userId = await seedUser(t);

    const equip1Id = await seedEquipment(t, org1Id);
    const equip2Id = await seedEquipment(t, org2Id);
    const sr1Id = await seedServiceRequest(t, org1Id, equip1Id, userId, "disputed");
    const sr2Id = await seedServiceRequest(t, org2Id, equip2Id, userId, "disputed");

    await seedDispute(t, org1Id, sr1Id, userId, "escalated");
    await seedDispute(t, org2Id, sr2Id, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.listEscalatedDisputes, {});

    expect(result).toHaveLength(2);
  });

  it("test_listEscalatedDisputes_requires_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asUser = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asUser.query(api.admin.serviceRequests.listEscalatedDisputes, {}),
    ).rejects.toThrow(ConvexError);
  });
});

// ===========================================================================
// admin/serviceRequests.getDisputeDetail
// ===========================================================================
describe("admin/serviceRequests.getDisputeDetail", () => {
  it("test_getDisputeDetail_returns_full_info_with_both_perspectives", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);

    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "Repair Co", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(t, hospitalOrgId, equipId, userId, "disputed", providerId);
    const disputeId = await seedDispute(t, hospitalOrgId, srId, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    const result = await asAdmin.query(api.admin.serviceRequests.getDisputeDetail, {
      disputeId: disputeId as any,
    });

    expect(result).not.toBeNull();
    expect(result?.dispute._id).toBe(disputeId);
    expect(result?.hospitalOrganization).not.toBeNull();
    expect(result?.serviceRequest).not.toBeNull();
  });

  it("test_getDisputeDetail_returns_null_for_missing_dispute", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });

    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    // Insert a real SR just to get a valid-looking ID format, then delete it
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const fakeDisputeId = await t.run(async (ctx) => {
      const now = Date.now();
      const id = await ctx.db.insert("disputes", {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        raisedBy: userId as any,
        status: "open",
        type: "quality",
        descriptionVi: "temp",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.delete(id);
      return id;
    });

    const result = await asAdmin.query(api.admin.serviceRequests.getDisputeDetail, {
      disputeId: fakeDisputeId as any,
    });

    expect(result).toBeNull();
  });
});

// ===========================================================================
// admin/serviceRequests.resolveDispute
// ===========================================================================
describe("admin/serviceRequests.resolveDispute", () => {
  it("test_resolveDispute_transitions_to_resolved_with_refund", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "disputed");
    const disputeId = await seedDispute(t, orgId, srId, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    await asAdmin.mutation(api.admin.serviceRequests.resolveDispute, {
      disputeId: disputeId as any,
      resolution: "refund",
      reasonVi: "Nhà cung cấp không hoàn thành công việc đúng tiêu chuẩn",
      reasonEn: "Provider did not complete work to standard",
      refundAmount: 1000000,
    });

    const updated = await t.run(async (ctx) => ctx.db.get(disputeId as any));
    expect(updated?.status).toBe("resolved");
    expect(updated?.resolutionNotes).toContain("refund");
  });

  it("test_resolveDispute_dismiss_action", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "disputed");
    const disputeId = await seedDispute(t, orgId, srId, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    await asAdmin.mutation(api.admin.serviceRequests.resolveDispute, {
      disputeId: disputeId as any,
      resolution: "dismiss",
      reasonVi: "Khiếu nại không có căn cứ",
      reasonEn: "Dispute has no basis",
    });

    const updated = await t.run(async (ctx) => ctx.db.get(disputeId as any));
    expect(updated?.status).toBe("resolved");
    expect(updated?.resolutionNotes).toContain("dismiss");
  });

  it("test_resolveDispute_requires_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "disputed");
    const disputeId = await seedDispute(t, orgId, srId, userId, "escalated");

    const asUser = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asUser.mutation(api.admin.serviceRequests.resolveDispute, {
        disputeId: disputeId as any,
        resolution: "dismiss",
        reasonVi: "test",
        reasonEn: "test",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("test_resolveDispute_creates_audit_log_entry", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "disputed");
    const disputeId = await seedDispute(t, orgId, srId, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    await asAdmin.mutation(api.admin.serviceRequests.resolveDispute, {
      disputeId: disputeId as any,
      resolution: "partial_refund",
      reasonVi: "Hoàn tiền một phần",
      reasonEn: "Partial refund awarded",
      refundAmount: 500000,
    });

    const auditEntries = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "admin.dispute.arbitrated"),
        )
        .collect(),
    );
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].newValues?.resolution).toBe("partial_refund");
  });
});

// ===========================================================================
// admin/serviceRequests.reassignProvider
// ===========================================================================
describe("admin/serviceRequests.reassignProvider", () => {
  it("test_reassignProvider_updates_service_request", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const hospitalOrgId = await seedOrganization(t, "Hospital X");
    const providerOrgId1 = await seedOrganization(t, "Provider One", "provider");
    const providerOrgId2 = await seedOrganization(t, "Provider Two", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const provider1Id = await seedProvider(t, providerOrgId1);
    const provider2Id = await seedProvider(t, providerOrgId2);
    const srId = await seedServiceRequest(t, hospitalOrgId, equipId, userId, "disputed", provider1Id);
    const disputeId = await seedDispute(t, hospitalOrgId, srId, userId, "escalated");

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    await asAdmin.mutation(api.admin.serviceRequests.reassignProvider, {
      serviceRequestId: srId as any,
      newProviderId: provider2Id as any,
      reasonVi: "Nhà cung cấp cũ không đáp ứng yêu cầu",
      reasonEn: "Original provider failed to meet requirements",
    });

    const updated = await t.run(async (ctx) => ctx.db.get(srId as any));
    expect(updated?.assignedProviderId).toBe(provider2Id);
  });

  it("test_reassignProvider_requires_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const providerOrgId = await seedOrganization(t, "Provider Co", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);

    const asUser = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asUser.mutation(api.admin.serviceRequests.reassignProvider, {
        serviceRequestId: srId as any,
        newProviderId: providerId as any,
        reasonVi: "test",
        reasonEn: "test",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("test_reassignProvider_creates_audit_log_entry", async () => {
    const t = convexTest(schema, modules);
    const adminId = await seedPlatformAdmin(t);
    const hospitalOrgId = await seedOrganization(t, "Hospital Y");
    const providerOrgId1 = await seedOrganization(t, "Old Provider", "provider");
    const providerOrgId2 = await seedOrganization(t, "New Provider", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const provider1Id = await seedProvider(t, providerOrgId1);
    const provider2Id = await seedProvider(t, providerOrgId2);
    const srId = await seedServiceRequest(t, hospitalOrgId, equipId, userId, "pending", provider1Id);

    const asAdmin = t.withIdentity({ subject: adminId, platformRole: "platform_admin" });
    await asAdmin.mutation(api.admin.serviceRequests.reassignProvider, {
      serviceRequestId: srId as any,
      newProviderId: provider2Id as any,
      reasonVi: "Thay đổi nhà cung cấp",
      reasonEn: "Provider reassigned",
    });

    const auditEntries = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "admin.serviceRequest.providerReassigned"),
        )
        .collect(),
    );
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].newValues?.newProviderId).toBe(provider2Id);
  });
});
