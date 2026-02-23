/**
 * Integration tests for platform admin hospital management functions.
 * Uses convex-test to exercise queries and mutations against an in-memory backend.
 *
 * Auth pattern: platform_admin uses { platformRole: "platform_admin", subject: userId }
 * via withIdentity — no organizationId needed (cross-tenant access).
 *
 * vi: "Kiểm tra tích hợp quản lý bệnh viện cho quản trị viên nền tảng"
 * en: "Integration tests for platform admin hospital management"
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
  overrides: Record<string, unknown> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "admin@sanglertech.com",
  platformRole?: "platform_admin" | "platform_support",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: platformRole ? "Platform Admin" : "Staff User",
      email,
      ...(platformRole ? { platformRole } : {}),
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

async function seedServiceRequest(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  equipId: string,
  userId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipId as any,
      requestedBy: userId as any,
      type: "repair",
      priority: "medium",
      status: "pending",
      descriptionVi: "Máy cần sửa chữa",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedMembership(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  userId: string,
  role: "owner" | "admin" | "member" = "member",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizationMemberships", {
      orgId: orgId as any,
      userId: userId as any,
      role,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// platformAdmin.listHospitals
// ===========================================================================
describe("platformAdmin.listHospitals", () => {
  it("test_listHospitals_returns_all_hospitals", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    await seedOrganization(t, "Bệnh viện A", "hospital");
    await seedOrganization(t, "Bệnh viện B", "hospital");
    await seedOrganization(t, "Provider Co", "provider"); // should NOT appear

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.query(api.admin.hospitals.listHospitals, {});
    expect(result.hospitals).toHaveLength(2);
    expect(result.hospitals.every((h: any) => h.org_type === "hospital")).toBe(
      true,
    );
  });

  it("test_listHospitals_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    await seedOrganization(t, "Active Hospital", "hospital", {
      status: "active",
    });
    await seedOrganization(t, "Suspended Hospital", "hospital", {
      status: "suspended",
    });
    await seedOrganization(t, "Trial Hospital", "hospital", {
      status: "trial",
    });

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.query(api.admin.hospitals.listHospitals, {
      status: "active",
    });
    expect(result.hospitals).toHaveLength(1);
    expect(result.hospitals[0].name).toBe("Active Hospital");
  });

  it("test_listHospitals_filters_by_search", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    await seedOrganization(t, "SPMET Hospital", "hospital");
    await seedOrganization(t, "City Clinic", "hospital");

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.query(api.admin.hospitals.listHospitals, {
      search: "SPMET",
    });
    expect(result.hospitals).toHaveLength(1);
    expect(result.hospitals[0].name).toBe("SPMET Hospital");
  });

  it("test_listHospitals_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "staff@hospital.vn");
    const orgId = await seedOrganization(t);
    await seedMembership(t, orgId, regularUserId, "owner");

    const asRegularUser = t.withIdentity({
      organizationId: orgId,
      subject: regularUserId,
    });

    await expect(
      asRegularUser.query(api.admin.hospitals.listHospitals, {}),
    ).rejects.toThrow();
  });

  it("test_listHospitals_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.admin.hospitals.listHospitals, {}),
    ).rejects.toThrow();
  });

  it("test_listHospitals_includes_member_and_equipment_counts", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const hospitalId = await seedOrganization(t, "Big Hospital", "hospital");
    const userId1 = await seedUser(t, "user1@hospital.vn");
    const userId2 = await seedUser(t, "user2@hospital.vn");
    await seedMembership(t, hospitalId, userId1, "owner");
    await seedMembership(t, hospitalId, userId2, "member");
    await seedEquipment(t, hospitalId);
    await seedEquipment(t, hospitalId);
    await seedEquipment(t, hospitalId);

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.query(api.admin.hospitals.listHospitals, {});
    expect(result.hospitals).toHaveLength(1);
    expect(result.hospitals[0].memberCount).toBe(2);
    expect(result.hospitals[0].equipmentCount).toBe(3);
  });
});

// ===========================================================================
// platformAdmin.getHospitalDetail
// ===========================================================================
describe("platformAdmin.getHospitalDetail", () => {
  it("test_getHospitalDetail_returns_org_with_members", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const hospitalId = await seedOrganization(t, "Detail Hospital");
    const ownerId = await seedUser(t, "owner@hospital.vn");
    await seedMembership(t, hospitalId, ownerId, "owner");

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = (await asAdmin.query(api.admin.hospitals.getHospitalDetail, {
      hospitalId: hospitalId as any,
    })) as any;

    expect(result).not.toBeNull();
    expect(result.organization.name).toBe("Detail Hospital");
    expect(result.members).toHaveLength(1);
    expect(result.members[0].role).toBe("owner");
  });

  it("test_getHospitalDetail_returns_null_for_nonexistent_org", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    // Create a real org then delete it to get a dangling ID
    const orgId = await seedOrganization(t);
    await t.run(async (ctx) => ctx.db.delete(orgId as any));

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.query(api.admin.hospitals.getHospitalDetail, {
      hospitalId: orgId as any,
    });
    expect(result).toBeNull();
  });

  it("test_getHospitalDetail_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const hospitalId = await seedOrganization(t);
    const regularUserId = await seedUser(t, "staff@hospital.vn");
    await seedMembership(t, hospitalId, regularUserId, "owner");

    const asRegular = t.withIdentity({
      organizationId: hospitalId,
      subject: regularUserId,
    });

    await expect(
      asRegular.query(api.admin.hospitals.getHospitalDetail, {
        hospitalId: hospitalId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.getHospitalUsage
// ===========================================================================
describe("platformAdmin.getHospitalUsage", () => {
  it("test_getHospitalUsage_returns_usage_metrics", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const hospitalId = await seedOrganization(t, "Usage Hospital");
    const userId = await seedUser(t, "user@hospital.vn");
    await seedMembership(t, hospitalId, userId, "owner");
    await seedEquipment(t, hospitalId);
    await seedEquipment(t, hospitalId);
    const equipId = await seedEquipment(t, hospitalId);
    await seedServiceRequest(t, hospitalId, equipId, userId);

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = (await asAdmin.query(api.admin.hospitals.getHospitalUsage, {
      hospitalId: hospitalId as any,
    })) as any;

    expect(result.equipmentCount).toBe(3);
    expect(result.activeMembers).toBe(1);
    expect(result.serviceRequestCount).toBe(1);
  });

  it("test_getHospitalUsage_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const hospitalId = await seedOrganization(t);
    const userId = await seedUser(t, "staff@hospital.vn");

    const asRegular = t.withIdentity({
      organizationId: hospitalId,
      subject: userId,
    });

    await expect(
      asRegular.query(api.admin.hospitals.getHospitalUsage, {
        hospitalId: hospitalId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.onboardHospital
// ===========================================================================
describe("platformAdmin.onboardHospital", () => {
  it("test_onboardHospital_creates_hospital_org", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = (await asAdmin.mutation(
      api.admin.hospitals.onboardHospital,
      {
        name: "New Hospital",
        slug: "new-hospital",
        ownerEmail: "owner@newhospital.vn",
        ownerName: "Hospital Owner",
      },
    )) as any;

    expect(result.success).toBe(true);
    expect(result.organizationId).toBeTruthy();

    // Verify org was created
    const org = await t.run(async (ctx) => ctx.db.get(result.organizationId));
    expect(org).not.toBeNull();
    expect((org as any).name).toBe("New Hospital");
    expect((org as any).org_type).toBe("hospital");
  });

  it("test_onboardHospital_rejects_duplicate_slug", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    await seedOrganization(t, "Existing Hospital", "hospital");

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    // existing-hospital slug already exists
    await expect(
      asAdmin.mutation(api.admin.hospitals.onboardHospital, {
        name: "Another Hospital",
        slug: "existing-hospital",
        ownerEmail: "owner@another.vn",
      }),
    ).rejects.toThrow();
  });

  it("test_onboardHospital_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "staff@hospital.vn");
    const orgId = await seedOrganization(t);
    await seedMembership(t, orgId, regularUserId, "owner");

    const asRegular = t.withIdentity({
      organizationId: orgId,
      subject: regularUserId,
    });

    await expect(
      asRegular.mutation(api.admin.hospitals.onboardHospital, {
        name: "New Hospital",
        slug: "new-hospital",
        ownerEmail: "owner@new.vn",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.suspendHospital
// ===========================================================================
describe("platformAdmin.suspendHospital", () => {
  it("test_suspendHospital_sets_status_to_suspended", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const hospitalId = await seedOrganization(
      t,
      "Active Hospital",
      "hospital",
      {
        status: "active",
      },
    );

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = (await asAdmin.mutation(
      api.admin.hospitals.suspendHospital,
      {
        hospitalId: hospitalId as any,
        reason: "Violation of terms of service",
      },
    )) as any;

    expect(result.success).toBe(true);

    const org = await t.run(async (ctx) => ctx.db.get(hospitalId as any));
    expect((org as any).status).toBe("suspended");
  });

  it("test_suspendHospital_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const hospitalId = await seedOrganization(t);
    const userId = await seedUser(t, "staff@hospital.vn");

    const asRegular = t.withIdentity({
      organizationId: hospitalId,
      subject: userId,
    });

    await expect(
      asRegular.mutation(api.admin.hospitals.suspendHospital, {
        hospitalId: hospitalId as any,
        reason: "Test reason for suspension",
      }),
    ).rejects.toThrow();
  });

  it("test_suspendHospital_throws_for_nonexistent_org", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const orgId = await seedOrganization(t);
    await t.run(async (ctx) => ctx.db.delete(orgId as any));

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    await expect(
      asAdmin.mutation(api.admin.hospitals.suspendHospital, {
        hospitalId: orgId as any,
        reason: "Test reason for suspension",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.reactivateHospital
// ===========================================================================
describe("platformAdmin.reactivateHospital", () => {
  it("test_reactivateHospital_sets_status_to_active", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const hospitalId = await seedOrganization(
      t,
      "Suspended Hospital",
      "hospital",
      {
        status: "suspended",
      },
    );

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = (await asAdmin.mutation(
      api.admin.hospitals.reactivateHospital,
      {
        hospitalId: hospitalId as any,
        notes: "Account reviewed and reinstated",
      },
    )) as any;

    expect(result.success).toBe(true);

    const org = await t.run(async (ctx) => ctx.db.get(hospitalId as any));
    expect((org as any).status).toBe("active");
  });

  it("test_reactivateHospital_throws_for_non_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const hospitalId = await seedOrganization(t);
    const userId = await seedUser(t, "staff@hospital.vn");

    const asRegular = t.withIdentity({
      organizationId: hospitalId,
      subject: userId,
    });

    await expect(
      asRegular.mutation(api.admin.hospitals.reactivateHospital, {
        hospitalId: hospitalId as any,
      }),
    ).rejects.toThrow();
  });
});
