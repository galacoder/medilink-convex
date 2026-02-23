/**
 * Integration tests for platform admin analytics query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp truy vấn phân tích nền tảng quản trị"
 * en: "Platform admin analytics query integration tests"
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
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name,
      email,
      createdAt: now,
      updatedAt: now,
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
      organizationId: orgId as never,
      nameVi: "Nhà cung cấp kiểm tra",
      nameEn: "Test Provider",
      status: "active",
      verificationStatus: "verified",
      averageRating: 4.5,
      totalRatings: 10,
      completedServices: 10,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedEquipment(t: ReturnType<typeof convexTest>, orgId: string) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const catId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Thiết bị chẩn đoán",
      nameEn: "Diagnostic Equipment",
      organizationId: orgId as never,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.insert("equipment", {
      nameVi: "Máy ECG",
      nameEn: "ECG Machine",
      categoryId: catId,
      organizationId: orgId as never,
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
  providerId: string | null = null,
  status:
    | "pending"
    | "quoted"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed" = "completed",
  createdAt = Date.now(),
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as never,
      equipmentId: equipId as never,
      requestedBy: userId as never,
      assignedProviderId: providerId as never,
      type: "repair",
      priority: "medium",
      status,
      descriptionVi: "Máy cần sửa chữa",
      completedAt: status === "completed" ? now : undefined,
      createdAt,
      updatedAt: now,
    });
  });
}

async function seedQuote(
  t: ReturnType<typeof convexTest>,
  serviceRequestId: string,
  providerId: string,
  amount: number,
  status: "pending" | "accepted" | "rejected" | "expired" = "accepted",
  createdAt = Date.now(),
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("quotes", {
      serviceRequestId: serviceRequestId as never,
      providerId: providerId as never,
      status,
      amount,
      currency: "VND",
      createdAt,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// admin/analytics.getOverviewStats
// ===========================================================================
describe("admin/analytics.getOverviewStats", () => {
  it("test_getOverviewStats_returnsAllCountsAsZeroForEmptyDb", async () => {
    const t = convexTest(schema, modules);

    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (api as any).admin.analytics.getOverviewStats,
        {},
      );

    expect(result).toBeDefined();
    expect(typeof result.totalHospitals).toBe("number");
    expect(typeof result.totalProviders).toBe("number");
    expect(typeof result.totalEquipment).toBe("number");
    expect(typeof result.totalServiceRequests).toBe("number");
    expect(typeof result.totalRevenue).toBe("number");
    expect(result.totalHospitals).toBe(0);
    expect(result.totalProviders).toBe(0);
    expect(result.totalEquipment).toBe(0);
    expect(result.totalServiceRequests).toBe(0);
    expect(result.totalRevenue).toBe(0);
  });

  it("test_getOverviewStats_countsTotalHospitalsAndProviders", async () => {
    const t = convexTest(schema, modules);

    // Seed hospitals and provider orgs
    await seedOrganization(t, "Hospital A", "hospital");
    await seedOrganization(t, "Hospital B", "hospital");
    const providerOrgId = await seedOrganization(t, "Provider Co", "provider");
    await seedProvider(t, providerOrgId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getOverviewStats, {});

    expect(result.totalHospitals).toBe(2);
    expect(result.totalProviders).toBe(1);
  });

  it("test_getOverviewStats_sumsRevenueFromCompletedServiceRequests", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(
      t,
      "Hospital Revenue",
      "hospital",
    );
    const providerOrgId = await seedOrganization(
      t,
      "Provider Revenue",
      "provider",
    );
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    // Completed service request with accepted quote
    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedQuote(t, srId, providerId, 2000000, "accepted");

    // Pending service request (should not count to revenue)
    const pendingSrId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "pending",
    );
    await seedQuote(t, pendingSrId, providerId, 1000000, "pending");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getOverviewStats, {});

    expect(result.totalRevenue).toBe(2000000);
    expect(result.totalServiceRequests).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// admin/analytics.getGrowthMetrics
// ===========================================================================
describe("admin/analytics.getGrowthMetrics", () => {
  it("test_getGrowthMetrics_returnsMonthlyHospitalAndProviderCounts", async () => {
    const t = convexTest(schema, modules);

    await seedOrganization(t, "Hospital Growth", "hospital");
    await seedOrganization(t, "Provider Growth Org", "provider");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getGrowthMetrics, { months: 6 });

    expect(Array.isArray(result.hospitalGrowth)).toBe(true);
    expect(Array.isArray(result.providerGrowth)).toBe(true);
    expect(result.hospitalGrowth.length).toBe(6);
    expect(result.providerGrowth.length).toBe(6);

    for (const item of result.hospitalGrowth) {
      expect(item).toHaveProperty("month");
      expect(item).toHaveProperty("count");
      expect(typeof item.count).toBe("number");
    }
  });

  it("test_getGrowthMetrics_usesDefaultMonthsOf6", async () => {
    const t = convexTest(schema, modules);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getGrowthMetrics, {});

    expect(result.hospitalGrowth.length).toBe(6);
  });
});

// ===========================================================================
// admin/analytics.getServiceMetrics
// ===========================================================================
describe("admin/analytics.getServiceMetrics", () => {
  it("test_getServiceMetrics_returnsMonthlyServiceRequestCounts", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(t, "Hospital SM", "hospital");
    const providerOrgId = await seedOrganization(t, "Provider SM", "provider");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "cancelled",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "pending",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getServiceMetrics, { months: 6 });

    expect(Array.isArray(result.monthlyVolume)).toBe(true);
    expect(result.monthlyVolume.length).toBe(6);
    expect(typeof result.overallCompletionRate).toBe("number");

    for (const item of result.monthlyVolume) {
      expect(item).toHaveProperty("month");
      expect(item).toHaveProperty("total");
      expect(item).toHaveProperty("completed");
      expect(item).toHaveProperty("completionRate");
    }
  });

  it("test_getServiceMetrics_computesCompletionRateCorrectly", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(t, "Hospital CR", "hospital");
    const providerOrgId = await seedOrganization(t, "Provider CR", "provider");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    // 2 completed, 2 cancelled => completion rate = 2/(2+2) = 0.5
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "cancelled",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "cancelled",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getServiceMetrics, {});

    expect(result.overallCompletionRate).toBe(0.5);
  });
});

// ===========================================================================
// admin/analytics.getRevenueMetrics
// ===========================================================================
describe("admin/analytics.getRevenueMetrics", () => {
  it("test_getRevenueMetrics_returnsRevenueBreakdownByHospitalAndProvider", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(t, "Hospital Rev", "hospital");
    const providerOrgId = await seedOrganization(t, "Provider Rev", "provider");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    const srId = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedQuote(t, srId, providerId, 3000000, "accepted");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getRevenueMetrics, {});

    expect(typeof result.totalRevenue).toBe("number");
    expect(typeof result.averageServiceValue).toBe("number");
    expect(Array.isArray(result.revenueByHospital)).toBe(true);
    expect(Array.isArray(result.revenueByProvider)).toBe(true);

    expect(result.totalRevenue).toBe(3000000);
  });

  it("test_getRevenueMetrics_returnsZeroForNoCompletedRequests", async () => {
    const t = convexTest(schema, modules);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getRevenueMetrics, {});

    expect(result.totalRevenue).toBe(0);
    expect(result.averageServiceValue).toBe(0);
    expect(result.revenueByHospital).toHaveLength(0);
    expect(result.revenueByProvider).toHaveLength(0);
  });

  it("test_getRevenueMetrics_returnsTopHospitalsAndProviders", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(t, "Hospital Top", "hospital");
    const providerOrgId = await seedOrganization(t, "Provider Top", "provider");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    // Create multiple completed service requests
    const sr1Id = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedQuote(t, sr1Id, providerId, 1000000, "accepted");

    const sr2Id = await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedQuote(t, sr2Id, providerId, 2000000, "accepted");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getRevenueMetrics, {});

    // Should have revenue entry for the hospital
    expect(result.revenueByHospital.length).toBeGreaterThanOrEqual(1);
    expect(result.revenueByHospital[0]).toHaveProperty("organizationName");
    expect(result.revenueByHospital[0]).toHaveProperty("totalRevenue");
    expect(result.revenueByHospital[0]).toHaveProperty("serviceCount");

    // Should have revenue entry for the provider
    expect(result.revenueByProvider.length).toBeGreaterThanOrEqual(1);
    expect(result.revenueByProvider[0]).toHaveProperty("providerName");
    expect(result.revenueByProvider[0]).toHaveProperty("totalRevenue");
  });
});

// ===========================================================================
// admin/analytics.getTopPerformers
// ===========================================================================
describe("admin/analytics.getTopPerformers", () => {
  it("test_getTopPerformers_returnsTopHospitalsByActivity", async () => {
    const t = convexTest(schema, modules);

    const hospitalOrgId = await seedOrganization(
      t,
      "Hospital Perf",
      "hospital",
    );
    const providerOrgId = await seedOrganization(
      t,
      "Provider Perf",
      "provider",
    );
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );
    await seedServiceRequest(
      t,
      hospitalOrgId,
      equipId,
      userId,
      providerId,
      "completed",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getTopPerformers, {});

    expect(Array.isArray(result.topHospitals)).toBe(true);
    expect(Array.isArray(result.topProviders)).toBe(true);

    if (result.topHospitals.length > 0) {
      expect(result.topHospitals[0]).toHaveProperty("organizationName");
      expect(result.topHospitals[0]).toHaveProperty("serviceRequestCount");
    }

    if (result.topProviders.length > 0) {
      expect(result.topProviders[0]).toHaveProperty("providerName");
      expect(result.topProviders[0]).toHaveProperty("averageRating");
    }
  });

  it("test_getTopPerformers_returnsEmptyArraysForNoData", async () => {
    const t = convexTest(schema, modules);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await t
      .withIdentity({
        subject: "admin_user_id",
        platformRole: "platform_admin",
      })
      .query((api as any).admin.analytics.getTopPerformers, {});

    expect(result.topHospitals).toHaveLength(0);
    expect(result.topProviders).toHaveLength(0);
  });
});
