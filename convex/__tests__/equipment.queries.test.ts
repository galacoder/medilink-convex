/**
 * Integration tests for equipment query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn thiết bị" / en: "Equipment query integration tests"
 */
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

// Module glob for convex-test to resolve function references
const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Test helper: create a convexTest instance with authenticated org context
// ---------------------------------------------------------------------------

/**
 * Creates a test context scoped to a specific organization.
 *
 * WHY: Every equipment query requires an authenticated identity with
 * organizationId in the JWT payload. This helper standardizes setup.
 */
function createTestWithOrg(orgId: string) {
  const t = convexTest(schema, modules);
  return t.withIdentity({
    name: "Test User",
    email: "test@spmet.edu.vn",
    organizationId: orgId,
  });
}

// ---------------------------------------------------------------------------
// Seed helpers: insert test data directly via ctx.db
// ---------------------------------------------------------------------------

async function seedOrganization(
  t: ReturnType<typeof convexTest>,
  name = "SPMET Healthcare School",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type: "hospital",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedCategory(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  nameVi = "Thiết bị chẩn đoán",
  nameEn = "Diagnostic Equipment",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("equipmentCategories", {
      nameVi,
      nameEn,
      organizationId: orgId as any,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedEquipment(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  categoryId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("equipment", {
      nameVi: "Máy điện tim ECG",
      nameEn: "ECG Machine",
      categoryId: categoryId as any,
      organizationId: orgId as any,
      status: "available",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ===========================================================================
// equipment.list
// ===========================================================================
describe("equipment.list", () => {
  it("test_list_returns_paginated_equipment_for_org", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    // Seed 3 equipment items
    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy ECG",
      nameEn: "ECG Monitor",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy đo huyết áp",
      nameEn: "Blood Pressure Monitor",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(3);
    expect(result.isDone).toBe(true);
  });

  it("test_list_returns_empty_for_wrong_org", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);

    // Seed equipment for org1
    await seedEquipment(t, org1Id, catId);

    // Query as org2 — should see nothing
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(0);
  });

  it("test_list_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    await seedEquipment(t, orgId, catId, { status: "available" });
    await seedEquipment(t, orgId, catId, { status: "available" });
    await seedEquipment(t, orgId, catId, { status: "maintenance" });

    const asOrg = t.withIdentity({ organizationId: orgId });

    const availableResult = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
      status: "available",
    });
    expect(availableResult.page).toHaveLength(2);

    const maintenanceResult = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
      status: "maintenance",
    });
    expect(maintenanceResult.page).toHaveLength(1);
  });

  it("test_list_filters_by_category", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const cat1Id = await seedCategory(t, orgId, "Danh mục 1", "Category 1");
    const cat2Id = await seedCategory(t, orgId, "Danh mục 2", "Category 2");

    await seedEquipment(t, orgId, cat1Id);
    await seedEquipment(t, orgId, cat1Id);
    await seedEquipment(t, orgId, cat2Id);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
      categoryId: cat1Id as any,
    });

    expect(result.page).toHaveLength(2);
    expect(result.page.every((e: any) => e.categoryId === cat1Id)).toBe(true);
  });

  it("test_list_searches_by_name_vietnamese", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy đo huyết áp",
      nameEn: "Blood Pressure Monitor",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
      search: "máy thở",
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].nameVi).toBe("Máy thở");
  });

  it("test_list_searches_by_name_english", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Máy đo huyết áp",
      nameEn: "Blood Pressure Monitor",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 10, cursor: null },
      search: "ventilator",
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].nameEn).toBe("Ventilator");
  });

  it("test_list_cursor_pagination_works", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    // Seed 5 items
    for (let i = 0; i < 5; i++) {
      await seedEquipment(t, orgId, catId, {
        nameVi: `Thiết bị ${i}`,
        nameEn: `Equipment ${i}`,
      });
    }

    const asOrg = t.withIdentity({ organizationId: orgId });

    // Fetch first page of 3
    const page1 = await asOrg.query(api.equipment.list, {
      paginationOpts: { numItems: 3, cursor: null },
    });

    expect(page1.page).toHaveLength(3);
    expect(page1.isDone).toBe(false);

    // Fetch second page using cursor
    const page2 = await asOrg.query(api.equipment.list, {
      paginationOpts: {
        numItems: 3,
        cursor: page1.continueCursor,
      },
    });

    expect(page2.page).toHaveLength(2);
    expect(page2.isDone).toBe(true);
  });

  it("test_list_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.equipment.list, {
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.getById
// ===========================================================================
describe("equipment.getById", () => {
  it("test_getById_returns_equipment_with_category", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.getById, {
      id: equipId as any,
    });

    expect(result).not.toBeNull();
    expect(result!._id).toBe(equipId);
    expect(result!.category).not.toBeNull();
    expect(result!.category!._id).toBe(catId);
  });

  it("test_getById_returns_null_for_wrong_org", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);

    // Query as org2
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.equipment.getById, {
      id: equipId as any,
    });

    // Should return null — not leak info about other org's equipment
    expect(result).toBeNull();
  });

  it("test_getById_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    await expect(
      t.query(api.equipment.getById, { id: equipId as any }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.getByCategory
// ===========================================================================
describe("equipment.getByCategory", () => {
  it("test_getByCategory_returns_filtered_list", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const cat1Id = await seedCategory(t, orgId, "Danh mục 1", "Category 1");
    const cat2Id = await seedCategory(t, orgId, "Danh mục 2", "Category 2");

    await seedEquipment(t, orgId, cat1Id);
    await seedEquipment(t, orgId, cat1Id);
    await seedEquipment(t, orgId, cat2Id);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.getByCategory, {
      categoryId: cat1Id as any,
    });

    expect(result).toHaveLength(2);
    expect(result.every((e: any) => e.categoryId === cat1Id)).toBe(true);
  });

  it("test_getByCategory_excludes_other_org_equipment", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const cat1Id = await seedCategory(t, org1Id);

    // Both orgs have equipment in cat1
    await seedEquipment(t, org1Id, cat1Id);
    await seedEquipment(t, org2Id, cat1Id); // cross-org (different org, same categoryId)

    // Org2 queries by cat1Id — should only see its own equipment
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.equipment.getByCategory, {
      categoryId: cat1Id as any,
    });

    expect(result).toHaveLength(1);
    expect(result[0].organizationId).toBe(org2Id);
  });
});

// ===========================================================================
// equipment.getHistory
// ===========================================================================
describe("equipment.getHistory", () => {
  it("test_getHistory_returns_empty_for_no_history", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.getHistory, {
      equipmentId: equipId as any,
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(0);
    expect(result.isDone).toBe(true);
  });

  it("test_getHistory_returns_sorted_entries", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    // Seed a user for history entries
    const userId = await t.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert("users", {
        name: "Test Technician",
        email: "tech@spmet.edu.vn",
        createdAt: now,
        updatedAt: now,
      });
    });

    // Insert 3 history entries with different timestamps
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("equipmentHistory", {
        equipmentId: equipId as any,
        actionType: "inspection",
        notes: "First inspection",
        performedBy: userId as any,
        createdAt: now - 2000,
        updatedAt: now - 2000,
      });
      await ctx.db.insert("equipmentHistory", {
        equipmentId: equipId as any,
        actionType: "maintenance",
        notes: "Routine maintenance",
        performedBy: userId as any,
        createdAt: now - 1000,
        updatedAt: now - 1000,
      });
      await ctx.db.insert("equipmentHistory", {
        equipmentId: equipId as any,
        actionType: "repair",
        notes: "Emergency repair",
        performedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.getHistory, {
      equipmentId: equipId as any,
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(3);
    // Verify descending order: most recent first
    expect(result.page[0].notes).toBe("Emergency repair");
    expect(result.page[1].notes).toBe("Routine maintenance");
    expect(result.page[2].notes).toBe("First inspection");
  });
});

// ===========================================================================
// equipment.getMaintenanceSchedule
// ===========================================================================
describe("equipment.getMaintenanceSchedule", () => {
  it("test_getMaintenanceSchedule_returns_upcoming", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const now = Date.now();
    const futureDate = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now

    // Insert scheduled maintenance record
    await t.run(async (ctx) => {
      await ctx.db.insert("maintenanceRecords", {
        equipmentId: equipId as any,
        type: "preventive",
        status: "scheduled",
        recurringPattern: "monthly",
        scheduledAt: futureDate,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.equipment.getMaintenanceSchedule, {
      equipmentId: equipId as any,
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("scheduled");
    expect(result[0].scheduledAt).toBe(futureDate);
  });

  it("test_getMaintenanceSchedule_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const now = Date.now();

    // Insert multiple records with different statuses
    await t.run(async (ctx) => {
      await ctx.db.insert("maintenanceRecords", {
        equipmentId: equipId as any,
        type: "preventive",
        status: "scheduled",
        recurringPattern: "none",
        scheduledAt: now + 1000,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("maintenanceRecords", {
        equipmentId: equipId as any,
        type: "corrective",
        status: "completed",
        recurringPattern: "none",
        scheduledAt: now - 1000,
        createdAt: now - 2000,
        updatedAt: now - 1000,
      });
      await ctx.db.insert("maintenanceRecords", {
        equipmentId: equipId as any,
        type: "inspection",
        status: "overdue",
        recurringPattern: "none",
        scheduledAt: now - 5000,
        createdAt: now - 6000,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // Default filter: scheduled + overdue
    const defaultResult = await asOrg.query(
      api.equipment.getMaintenanceSchedule,
      {
        equipmentId: equipId as any,
      },
    );
    expect(defaultResult).toHaveLength(2);

    // Custom filter: completed only
    const completedResult = await asOrg.query(
      api.equipment.getMaintenanceSchedule,
      {
        equipmentId: equipId as any,
        statusFilter: ["completed"],
      },
    );
    expect(completedResult).toHaveLength(1);
    expect(completedResult[0].status).toBe("completed");
  });

  it("test_getMaintenanceSchedule_returns_empty_for_wrong_org", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);

    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("maintenanceRecords", {
        equipmentId: equipId as any,
        type: "preventive",
        status: "scheduled",
        recurringPattern: "none",
        scheduledAt: now + 1000,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Query as org2
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.equipment.getMaintenanceSchedule, {
      equipmentId: equipId as any,
    });

    expect(result).toHaveLength(0);
  });
});
