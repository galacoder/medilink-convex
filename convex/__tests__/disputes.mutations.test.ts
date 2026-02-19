/**
 * Integration tests for dispute mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến tranh chấp" / en: "Dispute mutation integration tests"
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
      descriptionVi: "Chất lượng dịch vụ không đạt",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// disputes.create
// ===========================================================================
describe("disputes.create", () => {
  it("test_create_inserts_dispute_with_open_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    const disputeId = await asOrg.mutation(api.disputes.create, {
      organizationId: orgId as any,
      serviceRequestId: srId as any,
      type: "quality",
      descriptionVi: "Chất lượng dịch vụ không đạt yêu cầu",
    });

    const dispute = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(dispute).not.toBeNull();
    expect(dispute!.status).toBe("open");
    expect(dispute!.organizationId).toBe(orgId);
    expect(dispute!.serviceRequestId).toBe(srId);
    expect(dispute!.type).toBe("quality");
    expect(dispute!.createdAt).toBeGreaterThanOrEqual(before);
    expect(dispute!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("test_create_accepts_in_progress_service_request", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "in_progress");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.create, {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        type: "timeline",
        descriptionVi: "Thời hạn bị trễ",
      }),
    ).resolves.toBeTruthy();
  });

  it("test_create_rejects_pending_service_request", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "pending");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.create, {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        type: "quality",
        descriptionVi: "Mô tả",
      }),
    ).rejects.toThrow();
  });

  it("test_create_rejects_cancelled_service_request", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "cancelled");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.create, {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        type: "quality",
        descriptionVi: "Mô tả",
      }),
    ).rejects.toThrow();
  });

  it("test_create_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "completed");

    await expect(
      t.mutation(api.disputes.create, {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        type: "quality",
        descriptionVi: "Mô tả",
      }),
    ).rejects.toThrow();
  });

  it("test_create_rejects_service_request_from_different_org", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t, "Hospital A");
    const otherOrgId = await seedOrganization(t, "Hospital B");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, otherOrgId);
    const srId = await seedServiceRequest(t, otherOrgId, equipId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.create, {
        organizationId: orgId as any,
        serviceRequestId: srId as any,
        type: "quality",
        descriptionVi: "Mô tả",
      }),
    ).rejects.toThrow();
  });

  it("test_create_creates_audit_entry", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId, "completed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.disputes.create, {
      organizationId: orgId as any,
      serviceRequestId: srId as any,
      type: "quality",
      descriptionVi: "Mô tả",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db.query("auditLog").filter((q) => q.eq(q.field("action"), "dispute.created")).collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// disputes.updateStatus
// ===========================================================================
describe("disputes.updateStatus", () => {
  it("test_updateStatus_valid_transition_open_to_investigating", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.disputes.updateStatus, {
      id: disputeId as any,
      status: "investigating",
    });

    const dispute = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(dispute!.status).toBe("investigating");
  });

  it("test_updateStatus_invalid_transition_throws", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    // open -> resolved is invalid (must go through investigating first)
    await expect(
      asOrg.mutation(api.disputes.updateStatus, {
        id: disputeId as any,
        status: "resolved",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_terminal_state_throws", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "resolved");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.updateStatus, {
        id: disputeId as any,
        status: "closed",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_updates_updatedAt", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "open");

    const disputeBefore = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    const before = Date.now();

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    await asOrg.mutation(api.disputes.updateStatus, {
      id: disputeId as any,
      status: "investigating",
    });

    const disputeAfter = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(disputeAfter!.updatedAt).toBeGreaterThanOrEqual(before);
  });
});

// ===========================================================================
// disputes.addMessage
// ===========================================================================
describe("disputes.addMessage", () => {
  it("test_addMessage_inserts_message", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    const msgId = await asOrg.mutation(api.disputes.addMessage, {
      disputeId: disputeId as any,
      contentVi: "Chúng tôi cần xem xét vấn đề này",
      contentEn: "We need to review this issue",
    });

    const msg = await t.run(async (ctx) => ctx.db.get(msgId as any)) as any;
    expect(msg).not.toBeNull();
    expect(msg!.contentVi).toBe("Chúng tôi cần xem xét vấn đề này");
    expect(msg!.contentEn).toBe("We need to review this issue");
    expect(msg!.disputeId).toBe(disputeId);
    expect(msg!.createdAt).toBeGreaterThanOrEqual(before);
  });

  it("test_addMessage_throws_when_dispute_not_found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    // Create then delete a dispute to get a valid ID format that no longer exists
    const disputeId = await seedDispute(t, orgId, srId, userId);
    await t.run(async (ctx) => ctx.db.delete(disputeId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.disputes.addMessage, {
        disputeId: disputeId as any,
        contentVi: "Tin nhắn",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    await expect(
      t.mutation(api.disputes.addMessage, {
        disputeId: disputeId as any,
        contentVi: "Tin nhắn",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_creates_audit_log_entry", async () => {
    // WHY: Vietnamese medical device regulations require a 5-year audit trail for
    // all changes including dispute messages. addMessage must call createAuditEntry.
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.disputes.addMessage, {
      disputeId: disputeId as any,
      contentVi: "Tin nhắn kiểm tra audit",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "dispute.messageAdded"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].resourceType).toBe("disputeMessages");
  });
});

// ===========================================================================
// disputes.escalate
// ===========================================================================
describe("disputes.escalate", () => {
  it("test_escalate_transitions_to_escalated_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.disputes.escalate, {
      id: disputeId as any,
    });

    const dispute = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(dispute!.status).toBe("escalated");
  });

  it("test_escalate_from_investigating_is_valid", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "investigating");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.disputes.escalate, {
      id: disputeId as any,
    });

    const dispute = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(dispute!.status).toBe("escalated");
  });

  it("test_escalate_creates_audit_entry", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });
    await asOrg.mutation(api.disputes.escalate, { id: disputeId as any });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db.query("auditLog").filter((q) => q.eq(q.field("action"), "dispute.escalated")).collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// disputes.resolve
// ===========================================================================
describe("disputes.resolve", () => {
  it("test_resolve_sets_resolved_status_and_resolvedAt", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, orgId);
    const srId = await seedServiceRequest(t, orgId, equipId, userId);
    const disputeId = await seedDispute(t, orgId, srId, userId, "investigating");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    await asOrg.mutation(api.disputes.resolve, {
      id: disputeId as any,
      resolutionNotes: "Vấn đề đã được giải quyết sau khi xem xét kỹ.",
    });

    const dispute = await t.run(async (ctx) => ctx.db.get(disputeId as any)) as any;
    expect(dispute!.status).toBe("resolved");
    expect(dispute!.resolvedAt).toBeGreaterThanOrEqual(before);
    expect(dispute!.resolutionNotes).toBe("Vấn đề đã được giải quyết sau khi xem xét kỹ.");
  });
});
