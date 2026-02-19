/**
 * Integration tests for provider analytics query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp truy vấn phân tích nhà cung cấp"
 * en: "Provider analytics query integration tests"
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
      organizationId: orgId as any,
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

async function seedEquipment(
  t: ReturnType<typeof convexTest>,
  orgId: string,
) {
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
  providerId: string | null = null,
  status: "pending" | "quoted" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed" = "completed",
  createdAt = Date.now(),
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRequests", {
      organizationId: orgId as any,
      equipmentId: equipId as any,
      requestedBy: userId as any,
      assignedProviderId: providerId as any,
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
      serviceRequestId: serviceRequestId as any,
      providerId: providerId as any,
      status,
      amount,
      currency: "VND",
      createdAt,
      updatedAt: now,
    });
  });
}

async function seedServiceRating(
  t: ReturnType<typeof convexTest>,
  serviceRequestId: string,
  providerId: string,
  ratedById: string,
  rating: number,
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("serviceRatings", {
      serviceRequestId: serviceRequestId as any,
      providerId: providerId as any,
      ratedBy: ratedById as any,
      rating,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// analytics.getProviderSummary
// ===========================================================================
describe("analytics.getProviderSummary", () => {
  it("test_getProviderSummary_returnsBasicMetrics", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Provider Co", "provider");
    const hospitalOrgId = await seedOrganization(t, "Hospital A", "hospital");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    // Seed a completed service request with a quote
    const srId = await seedServiceRequest(
      t, hospitalOrgId, equipId, userId, providerId, "completed"
    );
    await seedQuote(t, srId, providerId, 500000, "accepted");
    await seedServiceRating(t, srId, providerId, userId, 5);

    const result = await t.query(
      api.analytics.getProviderSummary,
      { providerId, dateRange: "30d" },
    );

    expect(result).toBeDefined();
    expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(result.completedServices).toBeGreaterThanOrEqual(0);
    expect(result.averageRating).toBeGreaterThanOrEqual(0);
    expect(result.totalQuotesSubmitted).toBeGreaterThanOrEqual(0);
  });

  it("test_getProviderSummary_returnsZeroForNoData", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Empty Provider", "provider");
    const providerId = await seedProvider(t, providerOrgId);

    const result = await t.query(
      api.analytics.getProviderSummary,
      { providerId, dateRange: "30d" },
    );

    expect(result.totalRevenue).toBe(0);
    expect(result.completedServices).toBe(0);
    expect(result.totalQuotesSubmitted).toBe(0);
  });

  it("test_getProviderSummary_supportsAll3Presets", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Provider ABC", "provider");
    const providerId = await seedProvider(t, providerOrgId);

    for (const dateRange of ["7d", "30d", "90d"] as const) {
      const result = await t.query(
        api.analytics.getProviderSummary,
        { providerId, dateRange },
      );
      expect(result).toBeDefined();
    }
  });
});

// ===========================================================================
// analytics.getProviderRevenueByMonth
// ===========================================================================
describe("analytics.getProviderRevenueByMonth", () => {
  it("test_getProviderRevenueByMonth_returnsMonthlyBreakdown", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Provider Rev", "provider");
    const hospitalOrgId = await seedOrganization(t, "Hospital B", "hospital");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    const srId = await seedServiceRequest(
      t, hospitalOrgId, equipId, userId, providerId, "completed"
    );
    await seedQuote(t, srId, providerId, 1000000, "accepted");

    const result = await t.query(
      api.analytics.getProviderRevenueByMonth,
      { providerId, months: 6 },
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("month");
      expect(item).toHaveProperty("revenue");
      expect(item).toHaveProperty("completedServices");
    }
  });
});

// ===========================================================================
// analytics.getProviderRatings
// ===========================================================================
describe("analytics.getProviderRatings", () => {
  it("test_getProviderRatings_returnsRatingDistribution", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Provider Rated", "provider");
    const hospitalOrgId = await seedOrganization(t, "Hospital C", "hospital");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    const srId = await seedServiceRequest(
      t, hospitalOrgId, equipId, userId, providerId, "completed"
    );
    await seedServiceRating(t, srId, providerId, userId, 4);

    const result = await t.query(
      api.analytics.getProviderRatings,
      { providerId },
    );

    expect(result).toHaveProperty("averageRating");
    expect(result).toHaveProperty("distribution");
    expect(result).toHaveProperty("recentReviews");
    expect(Array.isArray(result.recentReviews)).toBe(true);
    // Distribution should have entries for 1-5 stars
    expect(result.distribution).toHaveLength(5);
  });

  it("test_getProviderRatings_returnsZeroAverageForNoRatings", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Unrated Provider", "provider");
    const providerId = await seedProvider(t, providerOrgId, {
      averageRating: undefined,
      totalRatings: 0,
    });

    const result = await t.query(
      api.analytics.getProviderRatings,
      { providerId },
    );

    expect(result.averageRating).toBe(0);
    expect(result.recentReviews).toHaveLength(0);
  });
});

// ===========================================================================
// analytics.getProviderHospitalRelationships
// ===========================================================================
describe("analytics.getProviderHospitalRelationships", () => {
  it("test_getProviderHospitalRelationships_returnsTopHospitals", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Provider H", "provider");
    const hospitalOrgId = await seedOrganization(t, "Hospital D", "hospital");
    const userId = await seedUser(t);
    const providerId = await seedProvider(t, providerOrgId);
    const equipId = await seedEquipment(t, hospitalOrgId);

    const srId = await seedServiceRequest(
      t, hospitalOrgId, equipId, userId, providerId, "completed"
    );
    await seedQuote(t, srId, providerId, 750000, "accepted");

    const result = await t.query(
      api.analytics.getProviderHospitalRelationships,
      { providerId },
    );

    expect(Array.isArray(result)).toBe(true);
    for (const item of result) {
      expect(item).toHaveProperty("hospitalName");
      expect(item).toHaveProperty("completedServices");
      expect(item).toHaveProperty("totalRevenue");
    }
  });

  it("test_getProviderHospitalRelationships_returnsEmptyForNoData", async () => {
    const t = convexTest(schema, modules);
    const providerOrgId = await seedOrganization(t, "Empty H Provider", "provider");
    const providerId = await seedProvider(t, providerOrgId);

    const result = await t.query(
      api.analytics.getProviderHospitalRelationships,
      { providerId },
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
