/**
 * Integration tests for equipment mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến thiết bị" / en: "Equipment mutation integration tests"
 */
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it } from "vitest";

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

async function seedCategory(t: ReturnType<typeof convexTest>, orgId: string) {
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
  overrides: Record<string, unknown> = {},
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
      ...overrides,
    });
  });
}

// ===========================================================================
// equipment.create
// ===========================================================================
describe("equipment.create", () => {
  it("test_create_inserts_equipment_with_timestamps", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    const asOrg = t.withIdentity({ organizationId: orgId });

    const before = Date.now();
    const equipId = await asOrg.mutation(api.equipment.create, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
      categoryId: catId as any,
    });

    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment).not.toBeNull();
    expect(equipment!.nameVi).toBe("Máy thở");
    expect(equipment!.nameEn).toBe("Ventilator");
    expect(equipment!.createdAt).toBeGreaterThanOrEqual(before);
    expect(equipment!.updatedAt).toBeGreaterThanOrEqual(before);
    expect(equipment!.createdAt).toBe(equipment!.updatedAt);
  });

  it("test_create_scopes_to_organizationId", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const equipId = await asOrg.mutation(api.equipment.create, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
      categoryId: catId as any,
    });

    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.organizationId).toBe(orgId);
  });

  it("test_create_defaults_status_to_available", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const equipId = await asOrg.mutation(api.equipment.create, {
      nameVi: "Máy thở",
      nameEn: "Ventilator",
      categoryId: catId as any,
    });

    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.status).toBe("available");
    expect(equipment!.condition).toBe("good");
    expect(equipment!.criticality).toBe("B");
  });

  it("test_create_validates_categoryId_exists", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    // Create category in a different org
    const otherOrgId = await seedOrganization(t, "Other Org");
    const otherCatId = await seedCategory(t, otherOrgId);

    const asOrg = t.withIdentity({ organizationId: orgId });

    // Category belongs to other org — should fail
    await expect(
      asOrg.mutation(api.equipment.create, {
        nameVi: "Máy thở",
        nameEn: "Ventilator",
        categoryId: otherCatId as any,
      }),
    ).rejects.toThrow();
  });

  it("test_create_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    await expect(
      t.mutation(api.equipment.create, {
        nameVi: "Máy thở",
        nameEn: "Ventilator",
        categoryId: catId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.update
// ===========================================================================
describe("equipment.update", () => {
  it("test_update_modifies_fields_and_updatedAt", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const before = Date.now();
    const asOrg = t.withIdentity({ organizationId: orgId });

    await asOrg.mutation(api.equipment.update, {
      id: equipId as any,
      nameVi: "Máy thở cập nhật",
      location: "Phòng A101",
    });

    const updated = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(updated!.nameVi).toBe("Máy thở cập nhật");
    expect(updated!.location).toBe("Phòng A101");
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("test_update_does_not_change_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "in_use",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // update mutation does not accept status arg — status field is excluded
    await asOrg.mutation(api.equipment.update, {
      id: equipId as any,
      nameVi: "Updated name",
    });

    const updated = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    // Status should remain in_use
    expect(updated!.status).toBe("in_use");
  });

  it("test_update_rejects_nonexistent_equipment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const otherOrgId = await seedOrganization(t, "Other Org");
    const asOtherOrg = t.withIdentity({ organizationId: otherOrgId });

    // Try to update equipment from a different org
    await expect(
      asOtherOrg.mutation(api.equipment.update, {
        id: equipId as any,
        nameVi: "Unauthorized update",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.updateStatus
// ===========================================================================
describe("equipment.updateStatus", () => {
  it("test_updateStatus_enforces_valid_transition", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "available",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.updateStatus, {
      id: equipId as any,
      newStatus: "in_use",
    });

    const updated = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(updated!.status).toBe("in_use");
  });

  it("test_updateStatus_rejects_invalid_transition", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);

    // retired -> available is invalid (retired is terminal)
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "retired",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await expect(
      asOrg.mutation(api.equipment.updateStatus, {
        id: equipId as any,
        newStatus: "available",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_blocks_retired_transitions", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "retired",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });

    // All transitions from retired should fail
    const targets = ["available", "in_use", "maintenance", "damaged"] as const;
    for (const target of targets) {
      await expect(
        asOrg.mutation(api.equipment.updateStatus, {
          id: equipId as any,
          newStatus: target,
        }),
      ).rejects.toThrow();
    }
  });

  it("test_updateStatus_creates_history_entry_when_user_found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "available",
    });

    // Create a user with matching subject (email in our implementation)
    const userEmail = "staff@spmet.edu.vn";
    await seedUser(t, userEmail);

    // Use the user's email as the subject in the identity
    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: userEmail,
    });

    await asOrg.mutation(api.equipment.updateStatus, {
      id: equipId as any,
      newStatus: "maintenance",
      notes: "Scheduled maintenance",
    });

    const history = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipId as any))
        .collect();
    });

    expect(history).toHaveLength(1);
    expect(history[0].actionType).toBe("status_change");
    expect(history[0].previousStatus).toBe("available");
    expect(history[0].newStatus).toBe("maintenance");
    expect(history[0].notes).toBe("Scheduled maintenance");
  });

  it("test_updateStatus_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    await expect(
      t.mutation(api.equipment.updateStatus, {
        id: equipId as any,
        newStatus: "in_use",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.addHistoryEntry
// ===========================================================================
describe("equipment.addHistoryEntry", () => {
  it("test_addHistoryEntry_creates_audit_record", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const historyId = await asOrg.mutation(api.equipment.addHistoryEntry, {
      equipmentId: equipId as any,
      actionType: "inspection",
      notes: "Annual inspection completed",
      performedBy: userId as any,
    });

    const history = (await t.run(async (ctx) =>
      ctx.db.get(historyId as any),
    )) as any;
    expect(history).not.toBeNull();
    expect(history!.actionType).toBe("inspection");
    expect(history!.notes).toBe("Annual inspection completed");
    expect(history!.equipmentId).toBe(equipId);
    expect(history!.performedBy).toBe(userId);
  });

  it("test_addHistoryEntry_links_to_equipment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.addHistoryEntry, {
      equipmentId: equipId as any,
      actionType: "repair",
      performedBy: userId as any,
    });

    const entries = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipId as any))
        .collect();
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].equipmentId).toBe(equipId);
  });

  it("test_addHistoryEntry_rejects_wrong_org_equipment", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);
    const userId = await seedUser(t);

    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    await expect(
      asOrg2.mutation(api.equipment.addHistoryEntry, {
        equipmentId: equipId as any,
        actionType: "inspection",
        performedBy: userId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.scheduleMaintenance
// ===========================================================================
describe("equipment.scheduleMaintenance", () => {
  it("test_scheduleMaintenance_creates_record", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const scheduledAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const asOrg = t.withIdentity({ organizationId: orgId });

    const maintenanceId = await asOrg.mutation(
      api.equipment.scheduleMaintenance,
      {
        equipmentId: equipId as any,
        type: "preventive",
        scheduledAt,
      },
    );

    const record = (await t.run(async (ctx) =>
      ctx.db.get(maintenanceId as any),
    )) as any;
    expect(record).not.toBeNull();
    expect(record!.type).toBe("preventive");
    expect(record!.status).toBe("scheduled");
    expect(record!.scheduledAt).toBe(scheduledAt);
    expect(record!.recurringPattern).toBe("none"); // default
  });

  it("test_scheduleMaintenance_with_recurring_pattern", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const maintenanceId = await asOrg.mutation(
      api.equipment.scheduleMaintenance,
      {
        equipmentId: equipId as any,
        type: "calibration",
        scheduledAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        recurringPattern: "quarterly",
      },
    );

    const record = (await t.run(async (ctx) =>
      ctx.db.get(maintenanceId as any),
    )) as any;
    expect(record!.recurringPattern).toBe("quarterly");
    expect(record!.type).toBe("calibration");
  });

  it("test_scheduleMaintenance_on_retired_equipment_fails", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "retired",
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    await expect(
      asOrg.mutation(api.equipment.scheduleMaintenance, {
        equipmentId: equipId as any,
        type: "preventive",
        scheduledAt: Date.now() + 1000,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// equipment.reportFailure
// ===========================================================================
describe("equipment.reportFailure", () => {
  it("test_reportFailure_creates_report", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const reportId = await asOrg.mutation(api.equipment.reportFailure, {
      equipmentId: equipId as any,
      urgency: "low",
      descriptionVi: "Máy hoạt động không ổn định",
      reportedBy: userId as any,
    });

    const report = (await t.run(async (ctx) =>
      ctx.db.get(reportId as any),
    )) as any;
    expect(report).not.toBeNull();
    expect(report!.urgency).toBe("low");
    expect(report!.status).toBe("open");
    expect(report!.descriptionVi).toBe("Máy hoạt động không ổn định");
  });

  it("test_reportFailure_creates_report_and_updates_status_for_critical", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "available",
    });
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.reportFailure, {
      equipmentId: equipId as any,
      urgency: "critical",
      descriptionVi: "Máy ngừng hoạt động đột ngột",
      reportedBy: userId as any,
    });

    // Equipment should now be "damaged"
    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.status).toBe("damaged");

    // History entry should exist for the auto-transition
    const history = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipId as any))
        .collect();
    });
    expect(history).toHaveLength(1);
    expect(history[0].previousStatus).toBe("available");
    expect(history[0].newStatus).toBe("damaged");
  });

  it("test_reportFailure_creates_report_and_updates_status_for_high", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "in_use",
    });
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.reportFailure, {
      equipmentId: equipId as any,
      urgency: "high",
      descriptionVi: "Máy phát ra tiếng kêu bất thường",
      reportedBy: userId as any,
    });

    // in_use -> damaged via high urgency
    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.status).toBe("damaged");
  });

  it("test_reportFailure_does_not_update_status_for_already_damaged", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "damaged",
    });
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.reportFailure, {
      equipmentId: equipId as any,
      urgency: "critical",
      descriptionVi: "Hư hỏng tiếp theo phát hiện",
      reportedBy: userId as any,
    });

    // No history entry should be created (already damaged, no transition needed)
    const history = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipId as any))
        .collect();
    });
    expect(history).toHaveLength(0);

    // Status should still be damaged
    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.status).toBe("damaged");
  });

  it("test_reportFailure_does_not_update_status_for_low_urgency", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId, {
      status: "available",
    });
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    await asOrg.mutation(api.equipment.reportFailure, {
      equipmentId: equipId as any,
      urgency: "low",
      descriptionVi: "Màn hình bị mờ nhẹ",
      reportedBy: userId as any,
    });

    // Status should remain available for low urgency
    const equipment = (await t.run(async (ctx) =>
      ctx.db.get(equipId as any),
    )) as any;
    expect(equipment!.status).toBe("available");
  });
});
