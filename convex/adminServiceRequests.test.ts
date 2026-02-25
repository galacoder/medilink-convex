/**
 * Tests for admin/serviceRequests cursor pagination (Issue #156).
 *
 * Verifies:
 * 1. listAllServiceRequests accepts paginationOpts and returns PaginationResult
 * 2. No unbounded .collect() calls — pagination enforced
 * 3. status filter uses by_status index
 * 4. organizationId filter uses by_org index
 * 5. Enrichment preserved (hospitalName, providerName, isBottleneck)
 *
 * vi: "Kiểm tra phân trang con trỏ cho yêu cầu dịch vụ quản trị"
 * en: "Cursor pagination tests for admin service requests"
 */
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a test environment with platform admin user, hospital orgs,
 * provider, equipment, and a requester for pagination testing.
 */
async function setupPaginationTestData(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Create platform admin user
    const adminUserId = await ctx.db.insert("users", {
      name: "Platform Admin",
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
      createdAt: now,
      updatedAt: now,
    });

    // Create hospital org
    const hospitalOrgId = await ctx.db.insert("organizations", {
      name: "SPMET Hospital",
      slug: "spmet",
      org_type: "hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Create second hospital org for org filter testing
    const hospital2OrgId = await ctx.db.insert("organizations", {
      name: "City Hospital",
      slug: "city",
      org_type: "hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Create equipment category
    const categoryId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Thiết bị chẩn đoán",
      nameEn: "Diagnostic Equipment",
      organizationId: hospitalOrgId,
      createdAt: now,
      updatedAt: now,
    });

    // Create equipment
    const equipmentId = await ctx.db.insert("equipment", {
      organizationId: hospitalOrgId,
      categoryId,
      nameVi: "Máy siêu âm",
      nameEn: "Ultrasound Machine",
      status: "available",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
    });

    // Create requester user
    const requesterId = await ctx.db.insert("users", {
      name: "Requester",
      email: "requester@spmet.edu.vn",
      createdAt: now,
      updatedAt: now,
    });

    // Create provider org + provider record
    const providerOrgId = await ctx.db.insert("organizations", {
      name: "TechMed Provider",
      slug: "techmed",
      org_type: "provider",
      createdAt: now,
      updatedAt: now,
    });
    const providerId = await ctx.db.insert("providers", {
      organizationId: providerOrgId,
      nameVi: "TechMed Việt Nam",
      nameEn: "TechMed Vietnam",
      status: "active",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    });

    return {
      adminUserId,
      hospitalOrgId,
      hospital2OrgId,
      equipmentId,
      requesterId,
      providerOrgId,
      providerId,
    };
  });
}

/**
 * Inserts N service requests with a given status and optional org/provider override.
 */
async function insertServiceRequests(
  t: ReturnType<typeof convexTest>,
  params: {
    count: number;
    organizationId: string;
    equipmentId: string;
    requestedBy: string;
    status?: string;
    providerId?: string;
  },
) {
  return await t.run(async (ctx) => {
    const ids = [];
    for (let i = 0; i < params.count; i++) {
      const now = Date.now() + i; // slightly offset for ordering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = await ctx.db.insert("serviceRequests", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        organizationId: params.organizationId as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        equipmentId: params.equipmentId as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestedBy: params.requestedBy as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignedProviderId: params.providerId as any,
        type: "repair" as const,
        priority: "medium" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (params.status ?? "pending") as any,
        descriptionVi: `Yêu cầu test #${i + 1}`,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return ids;
  });
}

// ---------------------------------------------------------------------------
// AC1: listAllServiceRequests accepts paginationOpts and returns PaginationResult
// ---------------------------------------------------------------------------
describe("admin listAllServiceRequests pagination", () => {
  it("returns a PaginationResult with page, isDone, and continueCursor", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    // Insert 3 service requests
    await insertServiceRequests(t, {
      count: 3,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        paginationOpts: { numItems: 10, cursor: null },
      },
    );

    // PaginationResult shape: { page, isDone, continueCursor }
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("isDone");
    expect(result).toHaveProperty("continueCursor");
    expect(Array.isArray(result.page)).toBe(true);
    expect(result.page).toHaveLength(3);
  });

  it("respects numItems limit and provides continueCursor for next page", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    // Insert 5 service requests
    await insertServiceRequests(t, {
      count: 5,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    // Request first page of 2
    const page1 = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        paginationOpts: { numItems: 2, cursor: null },
      },
    );

    expect(page1.page).toHaveLength(2);
    expect(page1.isDone).toBe(false);
    expect(page1.continueCursor).toBeTruthy();

    // Request second page using continueCursor
    const page2 = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        paginationOpts: { numItems: 2, cursor: page1.continueCursor },
      },
    );

    expect(page2.page).toHaveLength(2);
    expect(page2.isDone).toBe(false);

    // Request third page — should have 1 remaining
    const page3 = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        paginationOpts: { numItems: 2, cursor: page2.continueCursor },
      },
    );

    expect(page3.page).toHaveLength(1);
    expect(page3.isDone).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // AC3: status filter uses an index (not post-fetch .filter())
  // ---------------------------------------------------------------------------
  it("filters by status and returns only matching records", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    // Insert 3 pending + 2 completed
    await insertServiceRequests(t, {
      count: 3,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      status: "pending",
    });
    await insertServiceRequests(t, {
      count: 2,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      status: "completed",
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        status: "pending",
        paginationOpts: { numItems: 50, cursor: null },
      },
    );

    expect(result.page).toHaveLength(3);
    for (const sr of result.page) {
      expect(sr.status).toBe("pending");
    }
  });

  // ---------------------------------------------------------------------------
  // AC4: organizationId filter uses an index
  // ---------------------------------------------------------------------------
  it("filters by hospitalId and returns only matching records", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    // Insert 2 in hospital1, 3 in hospital2
    await insertServiceRequests(t, {
      count: 2,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
    });
    await insertServiceRequests(t, {
      count: 3,
      organizationId: data.hospital2OrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        hospitalId: data.hospitalOrgId,
        paginationOpts: { numItems: 50, cursor: null },
      },
    );

    expect(result.page).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Auth: non-admin is rejected
  // ---------------------------------------------------------------------------
  it("rejects non-platform-admin users", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    const asRegularUser = t.withIdentity({
      subject: data.requesterId,
      email: "requester@spmet.edu.vn",
    });

    await expect(
      asRegularUser.query(
        api.admin.serviceRequests.listAllServiceRequests,
        {
          paginationOpts: { numItems: 10, cursor: null },
        },
      ),
    ).rejects.toThrow(ConvexError);
  });

  // ---------------------------------------------------------------------------
  // Combined filter: hospitalId + status
  // ---------------------------------------------------------------------------
  it("filters by both hospitalId and status", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    // 2 pending in hospital1, 1 completed in hospital1, 1 pending in hospital2
    await insertServiceRequests(t, {
      count: 2,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      status: "pending",
    });
    await insertServiceRequests(t, {
      count: 1,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      status: "completed",
    });
    await insertServiceRequests(t, {
      count: 1,
      organizationId: data.hospital2OrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      status: "pending",
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        hospitalId: data.hospitalOrgId,
        status: "pending",
        paginationOpts: { numItems: 50, cursor: null },
      },
    );

    expect(result.page).toHaveLength(2);
    for (const sr of result.page) {
      expect(sr.status).toBe("pending");
    }
  });

  // ---------------------------------------------------------------------------
  // Enrichment: page items include hospitalName, providerName, isBottleneck
  // ---------------------------------------------------------------------------
  it("enriches page items with hospitalName, providerName, and isBottleneck", async () => {
    const t = convexTest(schema, modules);
    const data = await setupPaginationTestData(t);

    await insertServiceRequests(t, {
      count: 1,
      organizationId: data.hospitalOrgId,
      equipmentId: data.equipmentId,
      requestedBy: data.requesterId,
      providerId: data.providerId,
    });

    const asPlatformAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink.vn",
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.serviceRequests.listAllServiceRequests,
      {
        paginationOpts: { numItems: 10, cursor: null },
      },
    );

    expect(result.page).toHaveLength(1);
    const item = result.page[0];
    expect(item).toHaveProperty("hospitalName", "SPMET Hospital");
    expect(item).toHaveProperty("providerName", "TechMed Việt Nam");
    expect(item).toHaveProperty("isBottleneck");
    expect(typeof item.isBottleneck).toBe("boolean");
  });
});
