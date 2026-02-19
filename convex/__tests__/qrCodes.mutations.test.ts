/**
 * Integration tests for QR code mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến mã QR" / en: "QR code mutation integration tests"
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

async function seedQRCode(
  t: ReturnType<typeof convexTest>,
  equipmentId: string,
  orgId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("qrCodes", {
      equipmentId: equipmentId as any,
      organizationId: orgId as any,
      code: `${orgId}-${equipmentId}-${now}`,
      isActive: true,
      createdBy: userId as any,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

// ===========================================================================
// qrCodes.generateQRCode
// ===========================================================================
describe("qrCodes.generateQRCode", () => {
  it("test_generateQRCode_creates_new_code_for_equipment", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    await seedUser(t, DEFAULT_USER_EMAIL);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const result = await asOrg.mutation(api.qrCodes.generateQRCode, {
      equipmentId: equipId as any,
    });

    expect(result).not.toBeNull();
    expect(result!.equipmentId).toBe(equipId);
    expect(result!.organizationId).toBe(orgId);
    expect(result!.isActive).toBe(true);
    expect(result!.code).toContain(orgId);
    expect(result!.code).toContain(equipId);
  });

  it("test_generateQRCode_returns_existing_active_code", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t, DEFAULT_USER_EMAIL);
    // Pre-seed an active QR code
    const existingQrId = await seedQRCode(t, equipId, orgId, userId);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const result = await asOrg.mutation(api.qrCodes.generateQRCode, {
      equipmentId: equipId as any,
    });

    // Should return the existing QR code (idempotent)
    expect(result!._id).toBe(existingQrId);
  });

  it("test_generateQRCode_rejects_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);

    // No identity = unauthenticated
    await expect(
      t.mutation(api.qrCodes.generateQRCode, {
        equipmentId: equipId as any,
      }),
    ).rejects.toThrow();
  });

  it("test_generateQRCode_rejects_wrong_org_equipment", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    const equipId = await seedEquipment(t, org1Id, catId);
    await seedUser(t, DEFAULT_USER_EMAIL);

    // Authenticated as org2, but equipment belongs to org1
    const asOrg2 = t.withIdentity({
      organizationId: org2Id,
      subject: DEFAULT_USER_EMAIL,
    });

    await expect(
      asOrg2.mutation(api.qrCodes.generateQRCode, {
        equipmentId: equipId as any,
      }),
    ).rejects.toThrow(ConvexError);
  });
});

// ===========================================================================
// qrCodes.recordScan
// ===========================================================================
describe("qrCodes.recordScan", () => {
  it("test_recordScan_creates_log_entry_with_action", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t, DEFAULT_USER_EMAIL);
    const qrCodeId = await seedQRCode(t, equipId, orgId, userId);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const logId = await asOrg.mutation(api.qrCodes.recordScan, {
      qrCodeId: qrCodeId as any,
      action: "view",
    });

    expect(logId).toBeTruthy();

    // Verify the log entry was created
    const log = await t.run(async (ctx) => ctx.db.get(logId as any));
    expect(log).not.toBeNull();
    expect(log!.qrCodeId).toBe(qrCodeId);
    expect(log!.action).toBe("view");
    expect(log!.scannedBy).toBe(userId);
  });

  it("test_recordScan_rejects_invalid_qr_code_id", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    await seedUser(t, DEFAULT_USER_EMAIL);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    // Use a non-existent QR code ID
    const fakeId = await t.run(async (ctx) => {
      // Insert a dummy record to get a valid ID format, then delete it
      const id = await ctx.db.insert("qrCodes", {
        equipmentId: "nonexistent" as any,
        organizationId: orgId as any,
        code: "fake-code",
        isActive: false,
        createdBy: "fake" as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.delete(id);
      return id;
    });

    await expect(
      asOrg.mutation(api.qrCodes.recordScan, {
        qrCodeId: fakeId as any,
        action: "view",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("test_recordScan_records_borrow_action", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equipId = await seedEquipment(t, orgId, catId);
    const userId = await seedUser(t, DEFAULT_USER_EMAIL);
    const qrCodeId = await seedQRCode(t, equipId, orgId, userId);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const logId = await asOrg.mutation(api.qrCodes.recordScan, {
      qrCodeId: qrCodeId as any,
      action: "borrow",
      metadata: { sessionId: "test-session-123" },
    });

    const log = await t.run(async (ctx) => ctx.db.get(logId as any));
    expect(log!.action).toBe("borrow");
    expect(log!.metadata).toEqual({ sessionId: "test-session-123" });
  });
});

// ===========================================================================
// qrCodes.batchGenerateQRCodes
// ===========================================================================
describe("qrCodes.batchGenerateQRCodes", () => {
  it("test_batchGenerateQRCodes_creates_for_all_in_category", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    await seedEquipment(t, orgId, catId, {
      nameVi: "Thiết bị 1",
      nameEn: "Device 1",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Thiết bị 2",
      nameEn: "Device 2",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Thiết bị 3",
      nameEn: "Device 3",
    });
    await seedUser(t, DEFAULT_USER_EMAIL);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const result = await asOrg.mutation(api.qrCodes.batchGenerateQRCodes, {
      categoryId: catId as any,
    });

    expect(result.generated).toBe(3);
    expect(result.skipped).toBe(0);
  });

  it("test_batchGenerateQRCodes_skips_equipment_with_existing_qr", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const catId = await seedCategory(t, orgId);
    const equip1Id = await seedEquipment(t, orgId, catId, {
      nameVi: "Thiết bị 1",
      nameEn: "Device 1",
    });
    await seedEquipment(t, orgId, catId, {
      nameVi: "Thiết bị 2",
      nameEn: "Device 2",
    });
    const userId = await seedUser(t, DEFAULT_USER_EMAIL);

    // Pre-seed a QR code for equip1
    await seedQRCode(t, equip1Id, orgId, userId);

    const asOrg = t.withIdentity({
      organizationId: orgId,
      subject: DEFAULT_USER_EMAIL,
    });

    const result = await asOrg.mutation(api.qrCodes.batchGenerateQRCodes, {
      categoryId: catId as any,
    });

    expect(result.generated).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("test_batchGenerateQRCodes_rejects_wrong_org_category", async () => {
    const t = convexTest(schema, modules);
    const org1Id = await seedOrganization(t, "Org 1");
    const org2Id = await seedOrganization(t, "Org 2");
    const catId = await seedCategory(t, org1Id);
    await seedUser(t, DEFAULT_USER_EMAIL);

    // Authenticated as org2, category belongs to org1
    const asOrg2 = t.withIdentity({
      organizationId: org2Id,
      subject: DEFAULT_USER_EMAIL,
    });

    await expect(
      asOrg2.mutation(api.qrCodes.batchGenerateQRCodes, {
        categoryId: catId as any,
      }),
    ).rejects.toThrow(ConvexError);
  });
});
