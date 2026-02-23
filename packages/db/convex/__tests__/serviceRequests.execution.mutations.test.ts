/**
 * Integration tests for service execution mutations in serviceRequests.ts.
 * Tests: startService, updateProgress, completeService, submitCompletionReport
 *
 * WHY: Provider-side service execution is a critical workflow that transitions
 * service requests through accepted -> in_progress -> completed. These mutations
 * must enforce state machine rules, org-level access control, and create audit
 * trail entries per Vietnamese medical device regulation requirements.
 *
 * vi: "Kiểm tra tích hợp các đột biến thực hiện dịch vụ"
 * en: "Service execution mutation integration tests"
 */
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
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
  email = "provider@company.vn",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: "Provider Technician",
      email,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedEquipment(t: ReturnType<typeof convexTest>, orgId: string) {
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

async function seedProvider(t: ReturnType<typeof convexTest>, orgId: string) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("providers", {
      organizationId: orgId as any,
      nameVi: "Công ty Dịch vụ Y tế ABC",
      nameEn: "ABC Medical Service",
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
  status:
    | "pending"
    | "quoted"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed" = "accepted",
  providerId?: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipId as any,
      requestedBy: userId as any,
      assignedProviderId: providerId ? (providerId as any) : undefined,
      type: "repair",
      priority: "medium",
      status,
      descriptionVi: "Thiết bị cần sửa chữa gấp",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// serviceRequests.startService
// ===========================================================================
describe("serviceRequests.startService", () => {
  it("test_startService_transitions_accepted_to_in_progress", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "accepted",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    const before = Date.now();
    await asProvider.mutation(api.serviceRequests.startService, {
      id: srId as any,
    });

    const sr = (await t.run(async (ctx) => ctx.db.get(srId as any))) as any;
    expect(sr.status).toBe("in_progress");
    expect(sr.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("test_startService_rejects_non_accepted_status", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "pending",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    await expect(
      asProvider.mutation(api.serviceRequests.startService, {
        id: srId as any,
      }),
    ).rejects.toThrow();
  });

  it("test_startService_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "accepted",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });
    await asProvider.mutation(api.serviceRequests.startService, {
      id: srId as any,
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "serviceRequest.started"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_startService_rejects_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "accepted",
    );

    await expect(
      t.mutation(api.serviceRequests.startService, {
        id: srId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// serviceRequests.updateProgress
// ===========================================================================
describe("serviceRequests.updateProgress", () => {
  it("test_updateProgress_updates_notes_on_in_progress_request", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    const before = Date.now();
    await asProvider.mutation(api.serviceRequests.updateProgress, {
      id: srId as any,
      progressNotes: "Đã kiểm tra và xác định lỗi bo mạch chính",
      percentComplete: 50,
    });

    const sr = (await t.run(async (ctx) => ctx.db.get(srId as any))) as any;
    expect(sr.status).toBe("in_progress");
    expect(sr.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("test_updateProgress_rejects_non_in_progress_status", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "accepted",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    await expect(
      asProvider.mutation(api.serviceRequests.updateProgress, {
        id: srId as any,
        progressNotes: "Cập nhật tiến độ không hợp lệ",
      }),
    ).rejects.toThrow();
  });

  it("test_updateProgress_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });
    await asProvider.mutation(api.serviceRequests.updateProgress, {
      id: srId as any,
      progressNotes: "Đã tháo thiết bị và kiểm tra linh kiện bên trong",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "serviceRequest.progressUpdated"),
        )
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// serviceRequests.completeService
// ===========================================================================
describe("serviceRequests.completeService", () => {
  it("test_completeService_transitions_in_progress_to_completed", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    const before = Date.now();
    await asProvider.mutation(api.serviceRequests.completeService, {
      id: srId as any,
    });

    const sr = (await t.run(async (ctx) => ctx.db.get(srId as any))) as any;
    expect(sr.status).toBe("completed");
    expect(sr.completedAt).toBeGreaterThanOrEqual(before);
    expect(sr.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("test_completeService_rejects_non_in_progress_status", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "accepted",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    await expect(
      asProvider.mutation(api.serviceRequests.completeService, {
        id: srId as any,
      }),
    ).rejects.toThrow();
  });

  it("test_completeService_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });
    await asProvider.mutation(api.serviceRequests.completeService, {
      id: srId as any,
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "serviceRequest.completed"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_completeService_rejects_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
    );

    await expect(
      t.mutation(api.serviceRequests.completeService, {
        id: srId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// serviceRequests.submitCompletionReport
// ===========================================================================
describe("serviceRequests.submitCompletionReport", () => {
  it("test_submitCompletionReport_stores_report_in_completionReports_table", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "completed",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    const reportId = await asProvider.mutation(
      api.serviceRequests.submitCompletionReport,
      {
        id: srId as any,
        workDescriptionVi:
          "Đã thay thế bo mạch chính và hiệu chỉnh lại thiết bị",
        partsReplaced: ["Bo mạch chính", "Cáp kết nối"],
        nextMaintenanceRecommendation: "Kiểm tra sau 6 tháng",
        actualHours: 3.5,
      },
    );

    // Completion report stored in completionReports table (append-only schema rule)
    const report = (await t.run(async (ctx) =>
      ctx.db.get(reportId as any),
    )) as any;
    expect(report).not.toBeNull();
    expect(report.serviceRequestId).toBe(srId);
    expect(report.workDescriptionVi).toBe(
      "Đã thay thế bo mạch chính và hiệu chỉnh lại thiết bị",
    );
    expect(report.partsReplaced).toHaveLength(2);
    expect(report.actualHours).toBe(3.5);
  });

  it("test_submitCompletionReport_also_accepts_in_progress_status", async () => {
    // WHY: Providers sometimes submit report while still marking in_progress
    // before calling completeService. Allow both statuses.
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "in_progress",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    await expect(
      asProvider.mutation(api.serviceRequests.submitCompletionReport, {
        id: srId as any,
        workDescriptionVi: "Đã hoàn thành việc sửa chữa thiết bị y tế",
      }),
    ).resolves.toBeTruthy();
  });

  it("test_submitCompletionReport_rejects_pending_status", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "pending",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });

    await expect(
      asProvider.mutation(api.serviceRequests.submitCompletionReport, {
        id: srId as any,
        workDescriptionVi: "Đã hoàn thành việc sửa chữa thiết bị y tế",
      }),
    ).rejects.toThrow();
  });

  it("test_submitCompletionReport_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const providerOrgId = await seedOrganization(t, "ABC Medical", "provider");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const providerId = await seedProvider(t, providerOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "completed",
      providerId,
    );

    const asProvider = t.withIdentity({
      organizationId: providerOrgId,
      subject: userId,
    });
    await asProvider.mutation(api.serviceRequests.submitCompletionReport, {
      id: srId as any,
      workDescriptionVi:
        "Đã thay thế linh kiện và hoàn thành kiểm tra chức năng",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "serviceRequest.completionReportSubmitted"),
        )
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_submitCompletionReport_rejects_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const hospitalOrgId = await seedOrganization(t, "SPMET Hospital");
    const userId = await seedUser(t);
    const equipId = await seedEquipment(t, hospitalOrgId);
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      "completed",
    );

    await expect(
      t.mutation(api.serviceRequests.submitCompletionReport, {
        id: srId as any,
        workDescriptionVi: "Đã hoàn thành",
      }),
    ).rejects.toThrow();
  });
});
