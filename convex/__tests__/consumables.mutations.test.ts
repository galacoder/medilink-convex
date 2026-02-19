/**
 * Integration tests for consumables mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến vật tư tiêu hao" / en: "Consumables mutation integration tests"
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
  name = "SPMET Healthcare",
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
// consumables.create
// ===========================================================================
describe("consumables.create", () => {
  it("test_create_inserts_consumable_with_timestamps", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    const asOrg = t.withIdentity({ organizationId: orgId });

    const before = Date.now();
    const consumableId = await asOrg.mutation(api.consumables.create, {
      nameVi: "Băng gạc y tế",
      nameEn: "Medical Gauze",
      unitOfMeasure: "roll",
      categoryType: "disposables",
      currentStock: 50,
      parLevel: 10,
      reorderPoint: 15,
    });
    const after = Date.now();

    const consumable = await t.run(async (ctx) =>
      ctx.db.get(consumableId as any),
    );

    expect(consumable).not.toBeNull();
    expect(consumable!.nameVi).toBe("Băng gạc y tế");
    expect(consumable!.nameEn).toBe("Medical Gauze");
    expect(consumable!.createdAt).toBeGreaterThanOrEqual(before);
    expect(consumable!.createdAt).toBeLessThanOrEqual(after);
    expect(consumable!.updatedAt).toBe(consumable!.createdAt);
  });

  it("test_create_scopes_to_organizationId", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const consumableId = await asOrg.mutation(api.consumables.create, {
      nameVi: "Găng tay",
      nameEn: "Gloves",
      unitOfMeasure: "box",
      categoryType: "disposables",
      currentStock: 100,
      parLevel: 20,
      reorderPoint: 30,
    });

    const consumable = await t.run(async (ctx) =>
      ctx.db.get(consumableId as any),
    );
    expect(consumable!.organizationId).toBe(orgId);
  });

  it("test_create_validates_relatedEquipmentId", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedEquipmentCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);

    // Try to create consumable in org2 linked to org1's equipment — should throw
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    await expect(
      asOrg2.mutation(api.consumables.create, {
        nameVi: "Găng tay",
        nameEn: "Gloves",
        unitOfMeasure: "box",
        categoryType: "disposables",
        currentStock: 10,
        parLevel: 5,
        reorderPoint: 8,
        relatedEquipmentId: equipId as any,
      }),
    ).rejects.toThrow();
  });

  it("test_create_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.consumables.create, {
        nameVi: "Găng tay",
        nameEn: "Gloves",
        unitOfMeasure: "box",
        categoryType: "disposables",
        currentStock: 10,
        parLevel: 5,
        reorderPoint: 8,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// consumables.update
// ===========================================================================
describe("consumables.update", () => {
  it("test_update_modifies_fields_and_updatedAt", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const consumableId = await seedConsumable(t, orgId);

    const before = Date.now();
    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.consumables.update, {
      id: consumableId as any,
      nameVi: "Găng tay vô khuẩn",
      nameEn: "Sterile Gloves",
    });
    const after = Date.now();

    const updated = await t.run(async (ctx) => ctx.db.get(consumableId as any));
    expect(updated!.nameVi).toBe("Găng tay vô khuẩn");
    expect(updated!.nameEn).toBe("Sterile Gloves");
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated!.updatedAt).toBeLessThanOrEqual(after);
  });

  it("test_update_rejects_wrong_org_consumable", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const consumableId = await seedConsumable(t, org1Id);

    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    await expect(
      asOrg2.mutation(api.consumables.update, {
        id: consumableId as any,
        nameVi: "Changed Name",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// consumables.recordUsage
// ===========================================================================
describe("consumables.recordUsage", () => {
  it("test_recordUsage_decreases_stock_and_logs", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId, { currentStock: 100 });

    const asOrg = t.withIdentity({
      organizationId: orgId,
      email: "staff@spmet.edu.vn",
    });
    await asOrg.mutation(api.consumables.recordUsage, {
      consumableId: consumableId as any,
      quantity: 10,
      usedBy: userId as any,
      notes: "Used for training",
    });

    const updated = await t.run(async (ctx) => ctx.db.get(consumableId as any));
    expect(updated!.currentStock).toBe(90);

    // Verify usage log was created
    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("consumableUsageLog")
        .withIndex("by_consumable", (q) =>
          q.eq("consumableId", consumableId as any),
        )
        .collect(),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].transactionType).toBe("USAGE");
    expect(logs[0].quantity).toBe(10);
  });

  it("test_recordUsage_rejects_negative_stock", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId, { currentStock: 5 });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await expect(
      asOrg.mutation(api.consumables.recordUsage, {
        consumableId: consumableId as any,
        quantity: 10, // more than available
        usedBy: userId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// consumables.receiveStock
// ===========================================================================
describe("consumables.receiveStock", () => {
  it("test_receiveStock_increases_stock_and_logs", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId, { currentStock: 50 });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.consumables.receiveStock, {
      consumableId: consumableId as any,
      quantity: 25,
      usedBy: userId as any,
      notes: "Monthly restock",
    });

    const updated = await t.run(async (ctx) => ctx.db.get(consumableId as any));
    expect(updated!.currentStock).toBe(75);

    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("consumableUsageLog")
        .withIndex("by_consumable", (q) =>
          q.eq("consumableId", consumableId as any),
        )
        .collect(),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].transactionType).toBe("RECEIVE");
    expect(logs[0].quantity).toBe(25);
  });
});

// ===========================================================================
// consumables.adjustStock
// ===========================================================================
describe("consumables.adjustStock", () => {
  it("test_adjustStock_handles_positive_and_negative", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId, { currentStock: 50 });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // Positive adjustment
    await asOrg.mutation(api.consumables.adjustStock, {
      consumableId: consumableId as any,
      delta: 10,
      usedBy: userId as any,
      notes: "Found extra stock",
    });

    const afterPositive = await t.run(async (ctx) =>
      ctx.db.get(consumableId as any),
    );
    expect(afterPositive!.currentStock).toBe(60);

    // Negative adjustment
    await asOrg.mutation(api.consumables.adjustStock, {
      consumableId: consumableId as any,
      delta: -5,
      usedBy: userId as any,
      notes: "Waste disposal",
    });

    const afterNegative = await t.run(async (ctx) =>
      ctx.db.get(consumableId as any),
    );
    expect(afterNegative!.currentStock).toBe(55);

    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("consumableUsageLog")
        .withIndex("by_consumable", (q) =>
          q.eq("consumableId", consumableId as any),
        )
        .collect(),
    );
    expect(logs).toHaveLength(2);
    expect(logs.every((l: any) => l.transactionType === "ADJUSTMENT")).toBe(
      true,
    );
  });
});

// ===========================================================================
// consumables.createReorderRequest
// ===========================================================================
describe("consumables.createReorderRequest", () => {
  it("test_createReorderRequest_creates_pending_request", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const requestId = await asOrg.mutation(
      api.consumables.createReorderRequest,
      {
        consumableId: consumableId as any,
        quantity: 50,
        requestedBy: userId as any,
        notes: "Running low",
      },
    );

    const request = await t.run(async (ctx) => ctx.db.get(requestId as any));
    expect(request).not.toBeNull();
    expect(request!.status).toBe("pending");
    expect(request!.quantity).toBe(50);
    expect(request!.organizationId).toBe(orgId);
  });
});

// ===========================================================================
// consumables.updateReorderStatus
// ===========================================================================
describe("consumables.updateReorderStatus", () => {
  it("test_updateReorderStatus_approves_request", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId);

    const requestId = await t.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert("reorderRequests", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        quantity: 50,
        status: "pending",
        requestedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.consumables.updateReorderStatus, {
      id: requestId as any,
      status: "approved",
      approvedBy: userId as any,
    });

    const updated = await t.run(async (ctx) => ctx.db.get(requestId as any));
    expect(updated!.status).toBe("approved");
    expect(updated!.approvedBy).toBe(userId);
  });

  it("test_updateReorderStatus_receives_and_updates_stock", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const consumableId = await seedConsumable(t, orgId, { currentStock: 10 });

    const requestId = await t.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert("reorderRequests", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        quantity: 50,
        status: "ordered",
        requestedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.consumables.updateReorderStatus, {
      id: requestId as any,
      status: "received",
      approvedBy: userId as any,
    });

    // Stock should be increased by the order quantity
    const consumable = await t.run(async (ctx) =>
      ctx.db.get(consumableId as any),
    );
    expect(consumable!.currentStock).toBe(60); // 10 + 50

    // Usage log entry should be created
    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("consumableUsageLog")
        .withIndex("by_consumable", (q) =>
          q.eq("consumableId", consumableId as any),
        )
        .collect(),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].transactionType).toBe("RECEIVE");
  });
});
