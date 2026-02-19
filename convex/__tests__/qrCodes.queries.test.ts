/**
 * Integration tests for QR code query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn mã QR" / en: "QR code query integration tests"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

const DEFAULT_USER_EMAIL = "staff@spmet.edu.vn";

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
  email = DEFAULT_USER_EMAIL,
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

async function seedCategory(
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

async function seedQRCode(
  t: ReturnType<typeof convexTest>,
  equipmentId: string,
  orgId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const code = `${orgId}-${equipmentId}-${now}`;
    return ctx.db.insert("qrCodes", {
      equipmentId: equipmentId as any,
      organizationId: orgId as any,
      code,
      isActive: true,
      createdBy: userId as any,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ===========================================================================
// qrCodes.getByCode
// ===========================================================================
describe("qrCodes.getByCode", () => {
  it("test_getByCode_returns_qr_for_valid_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    // Manually compute the code that seedQRCode will create
    const now = Date.now();
    const code = `${orgId}-${equipId}-${now}`;
    await t.run(async (ctx) => {
      await ctx.db.insert("qrCodes", {
        equipmentId: equipId as any,
        organizationId: orgId as any,
        code,
        isActive: true,
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByCode, { code });

    expect(result).not.toBeNull();
    expect(result!.code).toBe(code);
    expect(result!.equipmentId).toBe(equipId);
    expect(result!.equipment).not.toBeNull();
    expect(result!.equipment!.nameEn).toBe("ECG Machine");
  });

  it("test_getByCode_returns_null_for_unknown_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByCode, {
      code: "nonexistent-code-xyz",
    });

    expect(result).toBeNull();
  });

  it("test_getByCode_returns_null_for_inactive_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    // Seed an INACTIVE QR code
    const now = Date.now();
    const code = `${orgId}-${equipId}-${now}-inactive`;
    await t.run(async (ctx) => {
      await ctx.db.insert("qrCodes", {
        equipmentId: equipId as any,
        organizationId: orgId as any,
        code,
        isActive: false, // inactive
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByCode, { code });

    // Should return null for inactive codes
    expect(result).toBeNull();
  });

  it("test_getByCode_rejects_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.qrCodes.getByCode, { code: "any-code" }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// qrCodes.getByEquipmentId
// ===========================================================================
describe("qrCodes.getByEquipmentId", () => {
  it("test_getByEquipmentId_returns_active_qr_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);
    const qrCodeId = await seedQRCode(t, equipId, orgId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByEquipmentId, {
      equipmentId: equipId as any,
    });

    expect(result).not.toBeNull();
    expect(result!._id).toBe(qrCodeId);
    expect(result!.isActive).toBe(true);
  });

  it("test_getByEquipmentId_returns_null_when_no_qr", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByEquipmentId, {
      equipmentId: equipId as any,
    });

    expect(result).toBeNull();
  });

  it("test_getByEquipmentId_enforces_org_scoping", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);
    const userId = await seedUser(t);

    // QR code exists for org1's equipment
    await seedQRCode(t, equipId, org1Id, userId);

    // Query as org2 — should return null (org isolation)
    const asOrg2 = t.withIdentity({ organizationId: org2Id });
    const result = await asOrg2.query(api.qrCodes.getByEquipmentId, {
      equipmentId: equipId as any,
    });

    expect(result).toBeNull();
  });

  it("test_getByEquipmentId_returns_null_for_inactive_qr_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t);

    // Seed an inactive QR code
    await seedQRCode(t, equipId, orgId, userId, { isActive: false });

    const asOrg = t.withIdentity({ organizationId: orgId });
    const result = await asOrg.query(api.qrCodes.getByEquipmentId, {
      equipmentId: equipId as any,
    });

    expect(result).toBeNull();
  });
});
