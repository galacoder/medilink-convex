/**
 * Integration tests for consumables query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn vật tư tiêu hao" / en: "Consumables query integration tests"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

// Module glob for convex-test to resolve function references
const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
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
  categoryId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("equipment", {
      nameVi: "Máy ECG",
      nameEn: "ECG Machine",
      categoryId: categoryId as any,
      organizationId: orgId as any,
      status: "available",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedEquipmentCategory(
  t: ReturnType<typeof convexTest>,
  orgId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("equipmentCategories", {
      nameVi: "Thiết bị chẩn đoán",
      nameEn: "Diagnostic Equipment",
      organizationId: orgId as any,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedConsumable(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("consumables", {
      organizationId: orgId as any,
      nameVi: "Găng tay y tế",
      nameEn: "Medical Gloves",
      unitOfMeasure: "box",
      categoryType: "disposables",
      currentStock: 100,
      parLevel: 20,
      reorderPoint: 30,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ===========================================================================
// consumables.list
// ===========================================================================
describe("consumables.list", () => {
  it("test_list_returns_paginated_consumables_for_org", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    await seedConsumable(t, orgId, { nameVi: "Găng tay", nameEn: "Gloves" });
    await seedConsumable(t, orgId, {
      nameVi: "Điện cực ECG",
      nameEn: "ECG Electrodes",
      categoryType: "electrodes",
    });
    await seedConsumable(t, orgId, {
      nameVi: "Cồn sát khuẩn",
      nameEn: "Disinfectant",
      categoryType: "cleaning_agents",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(3);
    expect(result.isDone).toBe(true);
  });

  it("test_list_returns_empty_for_wrong_org", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");

    await seedConsumable(t, org1Id);

    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(0);
  });

  it("test_list_filters_by_categoryType", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    await seedConsumable(t, orgId, { categoryType: "disposables" });
    await seedConsumable(t, orgId, { categoryType: "disposables" });
    await seedConsumable(t, orgId, { categoryType: "electrodes" });

    const asOrg = t.withIdentity({ organizationId: orgId });

    const disposablesResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      categoryType: "disposables",
    });
    expect(disposablesResult.page).toHaveLength(2);

    const electrodesResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      categoryType: "electrodes",
    });
    expect(electrodesResult.page).toHaveLength(1);
  });

  it("test_list_filters_by_stock_level", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    // in_stock: currentStock > reorderPoint
    await seedConsumable(t, orgId, {
      currentStock: 100,
      reorderPoint: 30,
      nameEn: "In Stock Item",
    });
    // low_stock: 0 < currentStock <= reorderPoint
    await seedConsumable(t, orgId, {
      currentStock: 20,
      reorderPoint: 30,
      nameEn: "Low Stock Item",
    });
    // out_of_stock: currentStock === 0
    await seedConsumable(t, orgId, {
      currentStock: 0,
      reorderPoint: 30,
      nameEn: "Out Of Stock Item",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    const lowResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      stockLevel: "low",
    });
    // low_stock includes items at or below reorderPoint (but not zero)
    expect(lowResult.page).toHaveLength(1);
    expect(lowResult.page[0].nameEn).toBe("Low Stock Item");

    const outResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      stockLevel: "out_of_stock",
    });
    expect(outResult.page).toHaveLength(1);
    expect(outResult.page[0].nameEn).toBe("Out Of Stock Item");
  });

  it("test_list_searches_by_name_bilingual", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    await seedConsumable(t, orgId, {
      nameVi: "Găng tay y tế",
      nameEn: "Medical Gloves",
    });
    await seedConsumable(t, orgId, {
      nameVi: "Điện cực ECG",
      nameEn: "ECG Electrodes",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // Search by Vietnamese name
    const viResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      search: "găng tay",
    });
    expect(viResult.page).toHaveLength(1);
    expect(viResult.page[0].nameVi).toBe("Găng tay y tế");

    // Search by English name
    const enResult = await asOrg.query(api.consumables.list, {
      paginationOpts: { numItems: 10, cursor: null },
      search: "electrodes",
    });
    expect(enResult.page).toHaveLength(1);
    expect(enResult.page[0].nameEn).toBe("ECG Electrodes");
  });
});

// ===========================================================================
// consumables.getById
// ===========================================================================
describe("consumables.getById", () => {
  it("test_getById_returns_consumable_with_equipment_link", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedEquipmentCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const consumableId = await seedConsumable(t, orgId, {
      relatedEquipmentId: equipId,
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.consumables.getById, {
      id: consumableId as any,
    });

    expect(result).not.toBeNull();
    expect(result!._id).toBe(consumableId);
    expect(result!.relatedEquipment).not.toBeNull();
    expect(result!.relatedEquipment!._id).toBe(equipId);
  });

  it("test_getById_returns_null_for_wrong_org", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const consumableId = await seedConsumable(t, org1Id);

    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.consumables.getById, {
      id: consumableId as any,
    });

    expect(result).toBeNull();
  });
});

// ===========================================================================
// consumables.getLowStock
// ===========================================================================
describe("consumables.getLowStock", () => {
  it("test_getLowStock_returns_items_below_reorderPoint", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    // currentStock <= reorderPoint — should appear in low stock
    await seedConsumable(t, orgId, {
      currentStock: 10,
      reorderPoint: 30,
      nameEn: "Low A",
    });
    await seedConsumable(t, orgId, {
      currentStock: 0,
      reorderPoint: 20,
      nameEn: "Out B",
    });
    // currentStock > reorderPoint — should NOT appear
    await seedConsumable(t, orgId, {
      currentStock: 100,
      reorderPoint: 30,
      nameEn: "OK C",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.consumables.getLowStock, {});

    expect(result).toHaveLength(2);
    const names = result.map((c: any) => c.nameEn);
    expect(names).toContain("Low A");
    expect(names).toContain("Out B");
  });

  it("test_getLowStock_excludes_adequately_stocked", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    await seedConsumable(t, orgId, { currentStock: 50, reorderPoint: 30 });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.consumables.getLowStock, {});

    expect(result).toHaveLength(0);
  });
});

// ===========================================================================
// consumables.getUsageLog
// ===========================================================================
describe("consumables.getUsageLog", () => {
  it("test_getUsageLog_returns_sorted_transactions", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId);

    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("consumableUsageLog", {
        consumableId: consumableId as any,
        quantity: 10,
        transactionType: "RECEIVE",
        usedBy: userId as any,
        notes: "First receive",
        createdAt: now - 2000,
        updatedAt: now - 2000,
      });
      await ctx.db.insert("consumableUsageLog", {
        consumableId: consumableId as any,
        quantity: 5,
        transactionType: "USAGE",
        usedBy: userId as any,
        notes: "First usage",
        createdAt: now - 1000,
        updatedAt: now - 1000,
      });
      await ctx.db.insert("consumableUsageLog", {
        consumableId: consumableId as any,
        quantity: 3,
        transactionType: "ADJUSTMENT",
        usedBy: userId as any,
        notes: "Stock adjustment",
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.consumables.getUsageLog, {
      consumableId: consumableId as any,
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(3);
    // Descending order: most recent first
    expect(result.page[0].notes).toBe("Stock adjustment");
    expect(result.page[1].notes).toBe("First usage");
    expect(result.page[2].notes).toBe("First receive");
  });
});

// ===========================================================================
// consumables.getReorderRequests
// ===========================================================================
describe("consumables.getReorderRequests", () => {
  it("test_getReorderRequests_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId);

    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("reorderRequests", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        quantity: 50,
        status: "pending",
        requestedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("reorderRequests", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        quantity: 30,
        status: "approved",
        requestedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("reorderRequests", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        quantity: 20,
        status: "received",
        requestedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // All requests
    const allResult = await asOrg.query(api.consumables.getReorderRequests, {});
    expect(allResult).toHaveLength(3);

    // Pending only
    const pendingResult = await asOrg.query(
      api.consumables.getReorderRequests,
      {
        status: "pending",
      },
    );
    expect(pendingResult).toHaveLength(1);
    expect(pendingResult[0].status).toBe("pending");

    // Approved only
    const approvedResult = await asOrg.query(
      api.consumables.getReorderRequests,
      {
        status: "approved",
      },
    );
    expect(approvedResult).toHaveLength(1);
  });
});
