/**
 * Integration tests for audit log query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * Access control: all queries require platform_admin role (no org context).
 *
 * vi: "Kiểm tra tích hợp các truy vấn nhật ký kiểm tra" / en: "Audit log query integration tests"
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
  platformRole?: "platform_admin" | "platform_support",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name,
      email,
      platformRole,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedAuditLog(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  actorId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("auditLog", {
      organizationId: orgId as any,
      actorId: actorId as any,
      action: "equipment.status_changed",
      resourceType: "equipment",
      resourceId: "eq_test_001",
      previousValues: { status: "available" },
      newValues: { status: "maintenance" },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ===========================================================================
// auditLog.list
// ===========================================================================
describe("auditLog.list", () => {
  it("test_list_returns_all_entries_for_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Hospital A");
    const org2Id = await seedOrganization(t, "Hospital B");
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Platform Admin",
      "platform_admin",
    );

    await seedAuditLog(t, org1Id, adminId);
    await seedAuditLog(t, org2Id, adminId, {
      action: "dispute.created",
      resourceType: "disputes",
    });

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {})) as any;

    expect(result.entries).toHaveLength(2);
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "equipment.status_changed" }),
        expect.objectContaining({ action: "dispute.created" }),
      ]),
    );
  });

  it("test_list_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.admin.auditLog.list, {})).rejects.toThrow();
  });

  it("test_list_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const staffId = await seedUser(t, "staff@hospital.com", "Staff User");
    // Regular org user — no platformRole
    const asStaff = t.withIdentity({ subject: staffId, organizationId: orgId });
    await expect(asStaff.query(api.admin.auditLog.list, {})).rejects.toThrow();
  });

  it("test_list_filters_by_resource_type", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, orgId, adminId, { resourceType: "equipment" });
    await seedAuditLog(t, orgId, adminId, { resourceType: "disputes" });
    await seedAuditLog(t, orgId, adminId, { resourceType: "disputes" });

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {
      resourceType: "disputes",
    })) as any;

    expect(result.entries).toHaveLength(2);
    expect(
      result.entries.every((e: any) => e.resourceType === "disputes"),
    ).toBe(true);
  });

  it("test_list_filters_by_organization", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Hospital A");
    const org2Id = await seedOrganization(t, "Hospital B");
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, org1Id, adminId);
    await seedAuditLog(t, org1Id, adminId);
    await seedAuditLog(t, org2Id, adminId);

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {
      organizationId: org1Id as any,
    })) as any;

    expect(result.entries).toHaveLength(2);
    expect(result.entries.every((e: any) => e.organizationId === org1Id)).toBe(
      true,
    );
  });

  it("test_list_filters_by_actor", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );
    const userId2 = await seedUser(t, "other@hospital.com", "Other");

    await seedAuditLog(t, orgId, adminId);
    await seedAuditLog(t, orgId, userId2);

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {
      actorId: adminId as any,
    })) as any;

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].actorId).toBe(adminId);
  });

  it("test_list_respects_limit", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    // Insert 5 entries
    for (let i = 0; i < 5; i++) {
      await seedAuditLog(t, orgId, adminId);
    }

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {
      limit: 2,
    })) as any;

    expect(result.entries).toHaveLength(2);
  });

  it("test_list_returns_isDone_true_when_no_more_entries", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, orgId, adminId);

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {
      limit: 50,
    })) as any;

    // Only 1 entry, limit 50 — isDone should be true
    expect(result.isDone).toBe(true);
  });

  it("test_list_includes_retention_metadata", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, orgId, adminId);

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = (await asAdmin.query(api.admin.auditLog.list, {})) as any;

    expect(result).toHaveProperty("oldestEntryAt");
    expect(result).toHaveProperty("totalCount");
  });
});

// ===========================================================================
// auditLog.getById
// ===========================================================================
describe("auditLog.getById", () => {
  it("test_getById_returns_full_entry_with_payload", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    const entryId = await seedAuditLog(t, orgId, adminId, {
      previousValues: { status: "available" },
      newValues: { status: "maintenance" },
    });

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const entry = (await asAdmin.query(api.admin.auditLog.getById, {
      id: entryId as any,
    })) as any;

    expect(entry).not.toBeNull();
    expect(entry._id).toBe(entryId);
    expect(entry.previousValues).toEqual({ status: "available" });
    expect(entry.newValues).toEqual({ status: "maintenance" });
  });

  it("test_getById_returns_null_when_not_found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    const entryId = await seedAuditLog(t, orgId, adminId);
    // Delete it so it no longer exists
    await t.run(async (ctx) => ctx.db.delete(entryId as any));

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const result = await asAdmin.query(api.admin.auditLog.getById, {
      id: entryId as any,
    });

    expect(result).toBeNull();
  });

  it("test_getById_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t, "staff@hospital.com", "Staff");
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    const entryId = await seedAuditLog(t, orgId, adminId);

    const asStaff = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asStaff.query(api.admin.auditLog.getById, { id: entryId as any }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// auditLog.exportCSV
// ===========================================================================
describe("auditLog.exportCSV", () => {
  it("test_exportCSV_returns_csv_string_with_headers", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t, "SPMET Hospital");
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, orgId, adminId);

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const csv = (await asAdmin.query(
      api.admin.auditLog.exportCSV,
      {},
    )) as string;

    expect(typeof csv).toBe("string");
    // CSV must have a header row
    expect(csv).toContain("Thời gian");
    expect(csv).toContain("Hành động");
    expect(csv).toContain("Loại tài nguyên");
  });

  it("test_exportCSV_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asStaff = t.withIdentity({ subject: userId, organizationId: orgId });
    await expect(
      asStaff.query(api.admin.auditLog.exportCSV, {}),
    ).rejects.toThrow();
  });

  it("test_exportCSV_includes_data_rows", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const adminId = await seedUser(
      t,
      "admin@sangtech.com",
      "Admin",
      "platform_admin",
    );

    await seedAuditLog(t, orgId, adminId, {
      action: "equipment.status_changed",
    });
    await seedAuditLog(t, orgId, adminId, { action: "dispute.created" });

    const asAdmin = t.withIdentity({
      subject: adminId,
      platformRole: "platform_admin",
    });
    const csv = (await asAdmin.query(
      api.admin.auditLog.exportCSV,
      {},
    )) as string;

    const lines = csv.trim().split("\n");
    // Header + 2 data rows
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });
});
