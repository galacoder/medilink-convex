/**
 * Integration tests for admin/providers Convex functions.
 * Platform admin operations: list, approve, reject, suspend, verify certifications.
 *
 * Access control model:
 *   - platformRole === "platform_admin" can access all providers (cross-tenant)
 *   - Uses JWT-based auth (requireAuth pattern from disputes.ts)
 *
 * vi: "Kiểm tra quản lý nhà cung cấp của quản trị viên nền tảng"
 * en: "Platform admin provider management integration tests"
 */

import { ConvexError } from "convex/values";
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
  name = "Provider Org",
  org_type: "hospital" | "provider" = "provider",
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
  email = "admin@sangtech.vn",
  platformRole?: "platform_admin" | "platform_support",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: "Admin User",
      email,
      platformRole,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedProvider(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  status: "active" | "inactive" | "suspended" | "pending_verification" = "pending_verification",
  verificationStatus: "pending" | "in_review" | "verified" | "rejected" = "pending",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("providers", {
      organizationId: orgId as any,
      nameVi: "Công ty Kỹ thuật Y tế",
      nameEn: "Medical Tech Company",
      companyName: "MedTech Co.",
      status,
      verificationStatus,
      contactEmail: "contact@medtech.vn",
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedCertification(
  t: ReturnType<typeof convexTest>,
  providerId: string,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("certifications", {
      providerId: providerId as any,
      nameVi: "Chứng nhận kỹ thuật y tế",
      nameEn: "Medical Technical Certification",
      issuingBody: "Vietnam Ministry of Health",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// platformAdmin.listProviders
// ===========================================================================
describe("admin/providers.platformAdmin.listProviders", () => {
  it("test_listProviders_returns_all_providers_for_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const org1Id = await seedOrganization(t, "Provider Alpha");
    const org2Id = await seedOrganization(t, "Provider Beta");
    await seedProvider(t, org1Id, "active", "verified");
    await seedProvider(t, org2Id, "pending_verification", "pending");

    // Platform admin has no organizationId in JWT
    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.listProviders,
      {},
    );

    expect(result).toHaveLength(2);
  });

  it("test_listProviders_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const org1Id = await seedOrganization(t, "Provider Alpha");
    const org2Id = await seedOrganization(t, "Provider Beta");
    await seedProvider(t, org1Id, "active", "verified");
    await seedProvider(t, org2Id, "pending_verification", "pending");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.listProviders,
      { status: "pending_verification" },
    );

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending_verification");
  });

  it("test_listProviders_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.admin.providers.listProviders, {}),
    ).rejects.toThrow();
  });

  it("test_listProviders_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");

    const asRegularUser = t.withIdentity({
      subject: regularUserId,
    });

    await expect(
      asRegularUser.query(api.admin.providers.listProviders, {}),
    ).rejects.toThrow();
  });

  it("test_listProviders_enriches_with_organization_name", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "SPMET Healthcare");
    await seedProvider(t, orgId, "active", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.listProviders,
      {},
    );

    expect(result[0].organizationName).toBe("SPMET Healthcare");
  });
});

// ===========================================================================
// platformAdmin.getProviderDetail
// ===========================================================================
describe("admin/providers.platformAdmin.getProviderDetail", () => {
  it("test_getProviderDetail_returns_full_provider_info", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.getProviderDetail,
      { providerId: providerId as any },
    );

    expect(result).not.toBeNull();
    expect(result!.nameVi).toBe("Công ty Kỹ thuật Y tế");
    expect(result!.status).toBe("active");
    expect(result!.verificationStatus).toBe("verified");
  });

  it("test_getProviderDetail_returns_null_when_not_found", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    // Create and delete a provider to get a valid-format but non-existent ID
    const providerId = await seedProvider(t, orgId, "active", "verified");
    await t.run(async (ctx) => ctx.db.delete(providerId as any));

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.getProviderDetail,
      { providerId: providerId as any },
    );

    expect(result).toBeNull();
  });

  it("test_getProviderDetail_includes_certifications", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");
    await seedCertification(t, providerId);

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.getProviderDetail,
      { providerId: providerId as any },
    );

    expect(result!.certifications).toHaveLength(1);
    expect(result!.certifications[0].nameEn).toBe("Medical Technical Certification");
  });

  it("test_getProviderDetail_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId);

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.query(api.admin.providers.getProviderDetail, {
        providerId: providerId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.getProviderPerformance
// ===========================================================================
describe("admin/providers.platformAdmin.getProviderPerformance", () => {
  it("test_getProviderPerformance_returns_metrics", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const result = await asPlatformAdmin.query(
      api.admin.providers.getProviderPerformance,
      { providerId: providerId as any },
    );

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("completionRate");
    expect(result).toHaveProperty("averageRating");
    expect(result).toHaveProperty("disputeCount");
    expect(result).toHaveProperty("completedServices");
    expect(result).toHaveProperty("totalServices");
  });

  it("test_getProviderPerformance_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId);

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.query(
        api.admin.providers.getProviderPerformance,
        { providerId: providerId as any },
      ),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.approveProvider
// ===========================================================================
describe("admin/providers.platformAdmin.approveProvider", () => {
  it("test_approveProvider_transitions_status_to_active", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification", "in_review");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.approveProvider,
      {
        providerId: providerId as any,
        notes: "Documents verified. Approved.",
      },
    );

    const provider = await t.run(async (ctx) => ctx.db.get(providerId as any)) as any;
    expect(provider!.status).toBe("active");
    expect(provider!.verificationStatus).toBe("verified");
  });

  it("test_approveProvider_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification", "in_review");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.approveProvider,
      { providerId: providerId as any },
    );

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "admin.provider.approved"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_approveProvider_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification");

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.mutation(
        api.admin.providers.approveProvider,
        { providerId: providerId as any },
      ),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.rejectProvider
// ===========================================================================
describe("admin/providers.platformAdmin.rejectProvider", () => {
  it("test_rejectProvider_transitions_status_to_rejected", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification", "in_review");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.rejectProvider,
      {
        providerId: providerId as any,
        reason: "Documents do not meet requirements",
      },
    );

    const provider = await t.run(async (ctx) => ctx.db.get(providerId as any)) as any;
    expect(provider!.verificationStatus).toBe("rejected");
  });

  it("test_rejectProvider_requires_reason", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification", "in_review");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await expect(
      asPlatformAdmin.mutation(
        api.admin.providers.rejectProvider,
        { providerId: providerId as any, reason: "" },
      ),
    ).rejects.toThrow();
  });

  it("test_rejectProvider_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "pending_verification");

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.mutation(
        api.admin.providers.rejectProvider,
        {
          providerId: providerId as any,
          reason: "Documents missing",
        },
      ),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.suspendProvider
// ===========================================================================
describe("admin/providers.platformAdmin.suspendProvider", () => {
  it("test_suspendProvider_sets_status_to_suspended", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.suspendProvider,
      {
        providerId: providerId as any,
        reason: "Repeated service quality violations",
      },
    );

    const provider = await t.run(async (ctx) => ctx.db.get(providerId as any)) as any;
    expect(provider!.status).toBe("suspended");
  });

  it("test_suspendProvider_reactivates_when_status_is_active", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "suspended", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    // Reactivate a suspended provider
    await asPlatformAdmin.mutation(
      api.admin.providers.suspendProvider,
      {
        providerId: providerId as any,
        reason: "Issue resolved",
        reactivate: true,
      },
    );

    const provider = await t.run(async (ctx) => ctx.db.get(providerId as any)) as any;
    expect(provider!.status).toBe("active");
  });

  it("test_suspendProvider_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.suspendProvider,
      {
        providerId: providerId as any,
        reason: "Violation detected",
      },
    );

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "admin.provider.suspended"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_suspendProvider_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active");

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.mutation(
        api.admin.providers.suspendProvider,
        {
          providerId: providerId as any,
          reason: "Test",
        },
      ),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// platformAdmin.verifyCertification
// ===========================================================================
describe("admin/providers.platformAdmin.verifyCertification", () => {
  it("test_verifyCertification_marks_expiry_and_updates_timestamp", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");
    const certId = await seedCertification(t, providerId);

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    const expiryDate = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year from now
    await asPlatformAdmin.mutation(
      api.admin.providers.verifyCertification,
      {
        certificationId: certId as any,
        isVerified: true,
        expiresAt: expiryDate,
      },
    );

    const cert = await t.run(async (ctx) => ctx.db.get(certId as any)) as any;
    expect(cert!.expiresAt).toBe(expiryDate);
  });

  it("test_verifyCertification_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");
    const certId = await seedCertification(t, providerId);

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await asPlatformAdmin.mutation(
      api.admin.providers.verifyCertification,
      {
        certificationId: certId as any,
        isVerified: true,
      },
    );

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "admin.provider.certification_verified"),
        )
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_verifyCertification_throws_when_cert_not_found", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(t, "admin@sangtech.vn", "platform_admin");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active", "verified");
    const certId = await seedCertification(t, providerId);
    await t.run(async (ctx) => ctx.db.delete(certId as any));

    const asPlatformAdmin = t.withIdentity({
      subject: adminUserId,
      platformRole: "platform_admin",
    });

    await expect(
      asPlatformAdmin.mutation(
        api.admin.providers.verifyCertification,
        {
          certificationId: certId as any,
          isVerified: true,
        },
      ),
    ).rejects.toThrow();
  });

  it("test_verifyCertification_throws_when_not_platform_admin", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "user@hospital.vn");
    const orgId = await seedOrganization(t, "Test Provider");
    const providerId = await seedProvider(t, orgId, "active");
    const certId = await seedCertification(t, providerId);

    const asRegularUser = t.withIdentity({ subject: regularUserId });

    await expect(
      asRegularUser.mutation(
        api.admin.providers.verifyCertification,
        {
          certificationId: certId as any,
          isVerified: true,
        },
      ),
    ).rejects.toThrow();
  });
});
