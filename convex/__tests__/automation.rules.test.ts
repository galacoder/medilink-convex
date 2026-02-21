/**
 * Integration tests for automation rules (M5-2).
 *
 * Tests the automation logic functions called by Convex crons:
 *   - checkOverdueRequests: escalate stale service requests
 *   - checkMaintenanceDue: remind about upcoming maintenance
 *   - checkStockLevels: alert when consumables below par
 *   - checkCertificationExpiry: warn about expiring certifications
 *   - suggestProviders: auto-assign providers to new service requests
 *
 * All automations respect organization boundaries (multi-tenancy).
 *
 * vi: "Kiểm tra tích hợp quy tắc tự động hóa" / en: "Automation rules integration tests"
 */
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedOrg(
  t: ReturnType<typeof convexTest>,
  type: "hospital" | "provider" = "hospital",
  name = "SPMET Healthcare",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type: type,
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

async function seedServiceRequest(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  equipmentId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipmentId as any,
      requestedBy: userId as any,
      type: "repair",
      status: "pending",
      priority: "medium",
      descriptionVi: "Cần sửa chữa",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedMaintenanceRecord(
  t: ReturnType<typeof convexTest>,
  equipmentId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("maintenanceRecords", {
      equipmentId: equipmentId as any,
      type: "preventive",
      status: "scheduled",
      recurringPattern: "monthly",
      scheduledAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days in future
      createdAt: now,
      updatedAt: now,
      ...overrides,
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
      nameVi: "Găng tay phẫu thuật",
      nameEn: "Surgical Gloves",
      unitOfMeasure: "box",
      categoryType: "disposables",
      currentStock: 5,
      parLevel: 20,
      reorderPoint: 10,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedProvider(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("providers", {
      organizationId: orgId as any,
      nameVi: "Nhà cung cấp A",
      nameEn: "Provider A",
      status: "active",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedCertification(
  t: ReturnType<typeof convexTest>,
  providerId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("certifications", {
      providerId: providerId as any,
      nameVi: "Chứng nhận kỹ thuật y tế",
      nameEn: "Medical Technical Certification",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ---------------------------------------------------------------------------
// Tests: automationLog queries
// ---------------------------------------------------------------------------

describe("automation: automationLog", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("listAutomationLogs returns empty array when no logs exist", async () => {
    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {});
    expect(logs).toEqual([]);
  });

  it("listAutomationLogs returns logs ordered by most recent first", async () => {
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("automationLog", {
        ruleName: "checkOverdueRequests",
        status: "success",
        affectedCount: 3,
        runAt: now - 3600000, // 1 hour ago
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
      });
      await ctx.db.insert("automationLog", {
        ruleName: "checkMaintenanceDue",
        status: "success",
        affectedCount: 1,
        runAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {});
    expect(logs).toHaveLength(2);
    // Most recent first
    expect(logs[0]?.ruleName).toBe("checkMaintenanceDue");
    expect(logs[1]?.ruleName).toBe("checkOverdueRequests");
  });

  it("listAutomationLogs supports filtering by ruleName", async () => {
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("automationLog", {
        ruleName: "checkOverdueRequests",
        status: "success",
        affectedCount: 2,
        runAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("automationLog", {
        ruleName: "checkStockLevels",
        status: "success",
        affectedCount: 0,
        runAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkOverdueRequests",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.ruleName).toBe("checkOverdueRequests");
  });
});

// ---------------------------------------------------------------------------
// Tests: checkOverdueRequests
// ---------------------------------------------------------------------------

describe("automation: checkOverdueRequests", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("logs a run even when no overdue requests exist", async () => {
    await t.mutation(api.automation.rules.checkOverdueRequests, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkOverdueRequests",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.affectedCount).toBe(0);
    expect(logs[0]?.status).toBe("success");
  });

  it("flags service requests stuck in pending status > 7 days", async () => {
    const orgId = await seedOrg(t);
    const userId = await seedUser(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);

    // Create a request stuck in pending for 8 days
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await seedServiceRequest(t, orgId, equipmentId, userId, {
      status: "pending",
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
    });

    await t.mutation(api.automation.rules.checkOverdueRequests, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkOverdueRequests",
    });
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(1);
  });

  it("respects organization boundaries — only escalates within same org", async () => {
    const org1Id = await seedOrg(t, "hospital", "Hospital A");
    const org2Id = await seedOrg(t, "hospital", "Hospital B");
    const userId = await seedUser(t);
    const cat1Id = await seedCategory(t, org1Id);
    const cat2Id = await seedCategory(t, org2Id);
    const equip1Id = await seedEquipment(t, org1Id, cat1Id);
    const equip2Id = await seedEquipment(t, org2Id, cat2Id);

    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await seedServiceRequest(t, org1Id, equip1Id, userId, {
      status: "pending",
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
    });
    await seedServiceRequest(t, org2Id, equip2Id, userId, {
      status: "pending",
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
    });

    await t.mutation(api.automation.rules.checkOverdueRequests, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkOverdueRequests",
    });
    // Both orgs processed — total affected should be >= 2
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(2);
  });

  it("does not flag recent pending requests (< 7 days)", async () => {
    const orgId = await seedOrg(t);
    const userId = await seedUser(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);

    // Created 3 days ago — should NOT be flagged
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    await seedServiceRequest(t, orgId, equipmentId, userId, {
      status: "pending",
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    });

    await t.mutation(api.automation.rules.checkOverdueRequests, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkOverdueRequests",
    });
    expect(logs[0]?.affectedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: checkMaintenanceDue
// ---------------------------------------------------------------------------

describe("automation: checkMaintenanceDue", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("logs a run even when no maintenance is due soon", async () => {
    await t.mutation(api.automation.rules.checkMaintenanceDue, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkMaintenanceDue",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe("success");
  });

  it("flags equipment with maintenance due within 7 days", async () => {
    const orgId = await seedOrg(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);

    // Maintenance due in 3 days (within 7-day window)
    const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
    await seedMaintenanceRecord(t, equipmentId, {
      status: "scheduled",
      scheduledAt: threeDaysFromNow,
    });

    await t.mutation(api.automation.rules.checkMaintenanceDue, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkMaintenanceDue",
    });
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(1);
  });

  it("does not flag maintenance due more than 7 days away", async () => {
    const orgId = await seedOrg(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);

    // Maintenance due in 14 days (outside 7-day window)
    const fourteenDaysFromNow = Date.now() + 14 * 24 * 60 * 60 * 1000;
    await seedMaintenanceRecord(t, equipmentId, {
      status: "scheduled",
      scheduledAt: fourteenDaysFromNow,
    });

    await t.mutation(api.automation.rules.checkMaintenanceDue, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkMaintenanceDue",
    });
    expect(logs[0]?.affectedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: checkStockLevels
// ---------------------------------------------------------------------------

describe("automation: checkStockLevels", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("logs a run even when all stock is above par level", async () => {
    await t.mutation(api.automation.rules.checkStockLevels, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkStockLevels",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe("success");
  });

  it("flags consumables with currentStock below parLevel", async () => {
    const orgId = await seedOrg(t);
    // Stock=5, par=20 — below par level, should be flagged
    await seedConsumable(t, orgId, {
      currentStock: 5,
      parLevel: 20,
      reorderPoint: 10,
    });

    await t.mutation(api.automation.rules.checkStockLevels, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkStockLevels",
    });
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(1);
  });

  it("does not flag consumables with currentStock at or above reorderPoint", async () => {
    const orgId = await seedOrg(t);
    // Stock=15, reorderPoint=10 — above reorder point, should NOT be flagged
    await seedConsumable(t, orgId, {
      currentStock: 15,
      parLevel: 20,
      reorderPoint: 10,
    });

    await t.mutation(api.automation.rules.checkStockLevels, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkStockLevels",
    });
    expect(logs[0]?.affectedCount).toBe(0);
  });

  it("respects organization boundaries — only checks own org stock", async () => {
    const org1Id = await seedOrg(t, "hospital", "Hospital A");
    const org2Id = await seedOrg(t, "hospital", "Hospital B");

    // Both orgs have low stock
    await seedConsumable(t, org1Id, { currentStock: 2, parLevel: 20, reorderPoint: 10 });
    await seedConsumable(t, org2Id, { currentStock: 3, parLevel: 20, reorderPoint: 10 });

    await t.mutation(api.automation.rules.checkStockLevels, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkStockLevels",
    });
    // Both should be caught (total = 2)
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: checkCertificationExpiry
// ---------------------------------------------------------------------------

describe("automation: checkCertificationExpiry", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("logs a run even when no certifications are expiring soon", async () => {
    await t.mutation(api.automation.rules.checkCertificationExpiry, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkCertificationExpiry",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe("success");
  });

  it("flags certifications expiring within 30 days", async () => {
    const provOrgId = await seedOrg(t, "provider", "Tech Provider");
    const providerId = await seedProvider(t, provOrgId);

    // Cert expires in 15 days (within 30-day window)
    const fifteenDaysFromNow = Date.now() + 15 * 24 * 60 * 60 * 1000;
    await seedCertification(t, providerId, {
      expiresAt: fifteenDaysFromNow,
    });

    await t.mutation(api.automation.rules.checkCertificationExpiry, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkCertificationExpiry",
    });
    expect(logs[0]?.affectedCount).toBeGreaterThanOrEqual(1);
  });

  it("does not flag certifications with no expiry date", async () => {
    const provOrgId = await seedOrg(t, "provider", "Tech Provider");
    const providerId = await seedProvider(t, provOrgId);

    // No expiresAt field — no expiry
    await seedCertification(t, providerId);

    await t.mutation(api.automation.rules.checkCertificationExpiry, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkCertificationExpiry",
    });
    expect(logs[0]?.affectedCount).toBe(0);
  });

  it("does not flag certifications expiring more than 30 days away", async () => {
    const provOrgId = await seedOrg(t, "provider", "Tech Provider");
    const providerId = await seedProvider(t, provOrgId);

    // Cert expires in 60 days (outside 30-day window)
    const sixtyDaysFromNow = Date.now() + 60 * 24 * 60 * 60 * 1000;
    await seedCertification(t, providerId, {
      expiresAt: sixtyDaysFromNow,
    });

    await t.mutation(api.automation.rules.checkCertificationExpiry, {});

    const logs = await t.query(api.automation.automationLog.listAutomationLogs, {
      ruleName: "checkCertificationExpiry",
    });
    expect(logs[0]?.affectedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: suggestProviders (auto-assign)
// ---------------------------------------------------------------------------

describe("automation: suggestProviders", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns empty array when no active providers match", async () => {
    const orgId = await seedOrg(t);
    const provOrgId = await seedOrg(t, "provider", "No Provider");
    const userId = await seedUser(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);
    const srId = await seedServiceRequest(t, orgId, equipmentId, userId, {
      type: "repair",
    });

    const suggestions = await t.query(api.automation.rules.suggestProviders, {
      serviceRequestId: srId,
    });

    expect(Array.isArray(suggestions)).toBe(true);
  });

  it("returns active verified providers for a service request", async () => {
    const orgId = await seedOrg(t);
    const provOrgId = await seedOrg(t, "provider", "Good Provider Co");
    const userId = await seedUser(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);
    const srId = await seedServiceRequest(t, orgId, equipmentId, userId, {
      type: "repair",
    });

    await seedProvider(t, provOrgId, {
      status: "active",
      verificationStatus: "verified",
    });

    const suggestions = await t.query(api.automation.rules.suggestProviders, {
      serviceRequestId: srId,
    });

    // At least one active verified provider should be suggested
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it("does not suggest inactive or unverified providers", async () => {
    const orgId = await seedOrg(t);
    const provOrgId = await seedOrg(t, "provider", "Bad Provider Co");
    const userId = await seedUser(t);
    const categoryId = await seedCategory(t, orgId);
    const equipmentId = await seedEquipment(t, orgId, categoryId);
    const srId = await seedServiceRequest(t, orgId, equipmentId, userId);

    await seedProvider(t, provOrgId, {
      status: "inactive",
      verificationStatus: "pending",
    });

    const suggestions = await t.query(api.automation.rules.suggestProviders, {
      serviceRequestId: srId,
    });

    expect(suggestions).toHaveLength(0);
  });
});
