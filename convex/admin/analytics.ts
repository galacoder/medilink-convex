/**
 * Convex queries for platform admin analytics.
 *
 * Aggregates cross-tenant metrics for the platform admin dashboard (M4-4).
 * These queries have NO organization scope — they aggregate data across
 * all hospitals and providers on the platform.
 *
 * Access control:
 *   - All queries are intended for platform_admin only.
 *   - Client-side gate is enforced by the admin portal layout.
 *
 * Data sources:
 *   - organizations: total hospital/provider counts, growth over time
 *   - providers: provider counts, ratings
 *   - equipment: total equipment count
 *   - serviceRequests: service volume, completion rate, response time
 *   - quotes: revenue (accepted quote amounts for completed SRs)
 *   - disputes: resolution time metrics
 *
 * Revenue definition:
 *   Revenue = sum of `quotes.amount` where quote.status = "accepted"
 *   AND the linked serviceRequest.status = "completed".
 *
 * vi: "Phân tích nền tảng quản trị" / en: "Platform admin analytics"
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// WHY: Following the same pattern as convex/admin/hospitals.ts to avoid
// importing the full better-auth stack which causes module resolution issues
// in the convex-test environment.
// ---------------------------------------------------------------------------

interface PlatformAuthContext {
  userId: string;
  platformRole: string | null;
}

/**
 * Extracts and validates platformRole from the JWT identity.
 * Throws bilingual ConvexError if not authenticated.
 *
 * vi: "Xác thực quản trị viên nền tảng" / en: "Authenticate platform admin"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<PlatformAuthContext & { email: string | null }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }
  return {
    userId: identity.subject as string,
    email: (identity.email as string | null) ?? null,
    platformRole: (identity.platformRole as string | null) ?? null,
  };
}

/**
 * Asserts the caller has platformRole === "platform_admin".
 * Falls back to the custom `users` table when JWT lacks platformRole
 * (Better Auth Convex component cannot store custom additionalFields).
 *
 * WHY: All platformAdmin.analytics.* queries share the same authorization guard.
 * Without this, any authenticated user could query cross-tenant platform data.
 *
 * vi: "Yêu cầu quyền quản trị viên nền tảng" / en: "Require platform admin role"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<PlatformAuthContext> {
  const auth = await localRequireAuth(ctx);

  if (auth.platformRole === "platform_admin") {
    return auth;
  }

  // JWT fallback: Better Auth Convex component cannot store platformRole.
  // Look it up from the custom `users` table using email from the JWT.
  if (auth.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", auth.email))
      .first();
    if (user?.platformRole === "platform_admin") {
      return { userId: auth.userId, platformRole: "platform_admin" };
    }
  }

  throw new ConvexError({
    code: "FORBIDDEN",
    // vi: "Chỉ quản trị viên nền tảng mới có quyền truy cập"
    // en: "Only platform admins can access this resource"
    message:
      "Chỉ quản trị viên nền tảng mới có quyền truy cập (Only platform admins can access this resource)",
  });
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Builds monthly bucket array for the last N months.
 * vi: "Tạo mảng nhóm theo tháng" / en: "Build monthly buckets"
 */
function buildMonthBuckets(numMonths: number): {
  year: number;
  month: number;
  label: string;
}[] {
  const now = new Date();
  const buckets: { year: number; month: number; label: string }[] = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${d.getMonth() + 1}/${d.getFullYear()}`,
    });
  }
  return buckets;
}

/**
 * Determines which bucket index a timestamp falls into.
 * Returns -1 if outside range.
 * vi: "Xác định chỉ số nhóm tháng" / en: "Find bucket index for timestamp"
 */
function findBucketIndex(
  ts: number,
  buckets: { year: number; month: number }[],
): number {
  const d = new Date(ts);
  return buckets.findIndex(
    (b) => b.year === d.getFullYear() && b.month === d.getMonth(),
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the top-level platform KPI summary:
 *   - totalHospitals: count of organizations with org_type = "hospital"
 *   - totalProviders: count of providers
 *   - totalEquipment: count of all equipment items
 *   - totalServiceRequests: count of all service requests
 *   - totalRevenue: sum of accepted quote amounts for completed service requests
 *
 * vi: "Thống kê tổng quan nền tảng" / en: "Platform overview statistics"
 */
export const getOverviewStats = query({
  args: {},
  handler: async (ctx) => {
    // Auth guard: only platform admins can view cross-tenant analytics
    await requirePlatformAdmin(ctx);

    // 1. Count hospitals (org_type = "hospital")
    const hospitalOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_type", (q) => q.eq("org_type", "hospital"))
      .collect();
    const totalHospitals = hospitalOrgs.length;

    // 2. Count providers (active provider records)
    const allProviders = await ctx.db.query("providers").collect();
    const totalProviders = allProviders.length;

    // 3. Count all equipment items
    const allEquipment = await ctx.db.query("equipment").collect();
    const totalEquipment = allEquipment.length;

    // 4. Count all service requests
    const allServiceRequests = await ctx.db.query("serviceRequests").collect();
    const totalServiceRequests = allServiceRequests.length;

    // 5. Revenue = sum of accepted quotes for completed service requests
    const completedSRIds = new Set(
      allServiceRequests
        .filter((sr) => sr.status === "completed")
        .map((sr) => sr._id as string),
    );

    const allAcceptedQuotes = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const totalRevenue = allAcceptedQuotes
      .filter((q) => completedSRIds.has(q.serviceRequestId as string))
      .reduce((sum, q) => sum + q.amount, 0);

    return {
      /** vi: "Tổng bệnh viện" / en: "Total hospitals" */
      totalHospitals,
      /** vi: "Tổng nhà cung cấp" / en: "Total providers" */
      totalProviders,
      /** vi: "Tổng thiết bị" / en: "Total equipment" */
      totalEquipment,
      /** vi: "Tổng yêu cầu dịch vụ" / en: "Total service requests" */
      totalServiceRequests,
      /** vi: "Tổng doanh thu" / en: "Total revenue" */
      totalRevenue,
    };
  },
});

/**
 * Returns monthly growth metrics for hospitals and providers.
 *   - hospitalGrowth: new hospital organizations per month
 *   - providerGrowth: new provider organizations per month (based on provider records)
 *
 * vi: "Chỉ số tăng trưởng theo tháng" / en: "Monthly growth metrics"
 */
export const getGrowthMetrics = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth guard: only platform admins can view cross-tenant growth metrics
    await requirePlatformAdmin(ctx);

    const numMonths = args.months ?? 6;
    const buckets = buildMonthBuckets(numMonths);

    const hospitalGrowth = buckets.map((b) => ({
      month: b.label,
      count: 0,
    }));
    const providerGrowth = buckets.map((b) => ({
      month: b.label,
      count: 0,
    }));

    // Count hospital org creations per month
    const allOrgs = await ctx.db.query("organizations").collect();
    for (const org of allOrgs) {
      const idx = findBucketIndex(org.createdAt, buckets);
      if (idx === -1) continue;
      if (org.org_type === "hospital") {
        hospitalGrowth[idx]!.count += 1;
      }
    }

    // Count provider record creations per month
    const allProviders = await ctx.db.query("providers").collect();
    for (const provider of allProviders) {
      const idx = findBucketIndex(provider.createdAt, buckets);
      if (idx === -1) continue;
      providerGrowth[idx]!.count += 1;
    }

    return {
      /** vi: "Tăng trưởng bệnh viện" / en: "Hospital growth" */
      hospitalGrowth,
      /** vi: "Tăng trưởng nhà cung cấp" / en: "Provider growth" */
      providerGrowth,
    };
  },
});

/**
 * Returns monthly service request volume and completion rate trend.
 *   - monthlyVolume: per-month service request counts with completion rate
 *   - overallCompletionRate: platform-wide completion rate (completed / completed+cancelled)
 *
 * vi: "Thống kê khối lượng dịch vụ" / en: "Service volume metrics"
 */
export const getServiceMetrics = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth guard: only platform admins can view cross-tenant service metrics
    await requirePlatformAdmin(ctx);

    const numMonths = args.months ?? 6;
    const buckets = buildMonthBuckets(numMonths);

    const monthlyVolume = buckets.map((b) => ({
      month: b.label,
      total: 0,
      completed: 0,
      cancelled: 0,
      completionRate: 0,
    }));

    const allServiceRequests = await ctx.db.query("serviceRequests").collect();

    let totalCompleted = 0;
    let totalCancelled = 0;

    for (const sr of allServiceRequests) {
      // Track overall completion for overallCompletionRate
      if (sr.status === "completed") totalCompleted += 1;
      if (sr.status === "cancelled") totalCancelled += 1;

      // Assign to monthly bucket
      const idx = findBucketIndex(sr.createdAt, buckets);
      if (idx === -1) continue;

      const bucket = monthlyVolume[idx]!;
      bucket.total += 1;
      if (sr.status === "completed") bucket.completed += 1;
      if (sr.status === "cancelled") bucket.cancelled += 1;
    }

    // Compute completion rate per bucket
    for (const bucket of monthlyVolume) {
      const terminal = bucket.completed + bucket.cancelled;
      bucket.completionRate = terminal > 0 ? bucket.completed / terminal : 0;
    }

    // Overall completion rate (completed / completed+cancelled)
    const totalTerminal = totalCompleted + totalCancelled;
    const overallCompletionRate =
      totalTerminal > 0 ? totalCompleted / totalTerminal : 0;

    return {
      /** vi: "Khối lượng dịch vụ theo tháng" / en: "Monthly service volume" */
      monthlyVolume,
      /** vi: "Tỷ lệ hoàn thành tổng thể" / en: "Overall completion rate" */
      overallCompletionRate,
    };
  },
});

/**
 * Returns revenue breakdown across the platform:
 *   - totalRevenue: sum of all completed service request values
 *   - averageServiceValue: totalRevenue / completedServiceCount
 *   - revenueByHospital: top hospitals sorted by total revenue
 *   - revenueByProvider: top providers sorted by total revenue
 *
 * vi: "Thống kê doanh thu nền tảng" / en: "Platform revenue metrics"
 */
export const getRevenueMetrics = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth guard: only platform admins can view cross-tenant revenue data
    await requirePlatformAdmin(ctx);

    const limit = args.limit ?? 10;

    // Get all completed service requests
    const allServiceRequests = await ctx.db.query("serviceRequests").collect();
    const completedSRs = allServiceRequests.filter(
      (sr) => sr.status === "completed",
    );

    if (completedSRs.length === 0) {
      return {
        totalRevenue: 0,
        averageServiceValue: 0,
        revenueByHospital: [] as {
          organizationId: string;
          organizationName: string;
          totalRevenue: number;
          serviceCount: number;
        }[],
        revenueByProvider: [] as {
          providerId: string;
          providerName: string;
          totalRevenue: number;
          serviceCount: number;
        }[],
      };
    }

    const completedSRMap = new Map(completedSRs.map((sr) => [sr._id as string, sr]));

    // Get all accepted quotes linked to completed SRs
    const allAcceptedQuotes = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const revenueQuotes = allAcceptedQuotes.filter((q) =>
      completedSRMap.has(q.serviceRequestId as string),
    );

    const totalRevenue = revenueQuotes.reduce((sum, q) => sum + q.amount, 0);
    const averageServiceValue =
      revenueQuotes.length > 0 ? totalRevenue / revenueQuotes.length : 0;

    // Group revenue by hospital organization
    const hospitalRevenueMap = new Map<
      string,
      { totalRevenue: number; serviceCount: number }
    >();
    // Group revenue by provider
    const providerRevenueMap = new Map<
      string,
      { totalRevenue: number; serviceCount: number }
    >();

    for (const quote of revenueQuotes) {
      const sr = completedSRMap.get(quote.serviceRequestId as string);
      if (!sr) continue;

      const orgId = sr.organizationId as string;
      const providerId = quote.providerId as string;

      const hospitalEntry = hospitalRevenueMap.get(orgId) ?? {
        totalRevenue: 0,
        serviceCount: 0,
      };
      hospitalEntry.totalRevenue += quote.amount;
      hospitalEntry.serviceCount += 1;
      hospitalRevenueMap.set(orgId, hospitalEntry);

      const providerEntry = providerRevenueMap.get(providerId) ?? {
        totalRevenue: 0,
        serviceCount: 0,
      };
      providerEntry.totalRevenue += quote.amount;
      providerEntry.serviceCount += 1;
      providerRevenueMap.set(providerId, providerEntry);
    }

    // Resolve hospital names
    const revenueByHospital = await Promise.all(
      Array.from(hospitalRevenueMap.entries())
        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
        .map(async ([orgId, data]) => {
          const org = await ctx.db.get(orgId as Id<"organizations">);
          return {
            organizationId: orgId,
            organizationName: org?.name ?? "Unknown",
            totalRevenue: data.totalRevenue,
            serviceCount: data.serviceCount,
          };
        }),
    );

    // Resolve provider names
    const revenueByProvider = await Promise.all(
      Array.from(providerRevenueMap.entries())
        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
        .map(async ([providerId, data]) => {
          const provider = await ctx.db.get(providerId as Id<"providers">);
          return {
            providerId,
            providerName: provider?.nameVi ?? "Unknown",
            totalRevenue: data.totalRevenue,
            serviceCount: data.serviceCount,
          };
        }),
    );

    return {
      /** vi: "Tổng doanh thu" / en: "Total revenue" */
      totalRevenue,
      /** vi: "Giá trị dịch vụ trung bình" / en: "Average service value" */
      averageServiceValue,
      /** vi: "Doanh thu theo bệnh viện" / en: "Revenue by hospital" */
      revenueByHospital,
      /** vi: "Doanh thu theo nhà cung cấp" / en: "Revenue by provider" */
      revenueByProvider,
    };
  },
});

/**
 * Returns top performers on the platform:
 *   - topHospitals: top 5 hospitals by total service request count
 *   - topProviders: top 5 providers by rating
 *
 * vi: "Đơn vị hàng đầu" / en: "Top performers"
 */
export const getTopPerformers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth guard: only platform admins can view cross-tenant top performer data
    await requirePlatformAdmin(ctx);

    const limit = args.limit ?? 5;

    // Top hospitals by service request count
    const allServiceRequests = await ctx.db.query("serviceRequests").collect();
    const srCountByOrg = new Map<string, number>();
    for (const sr of allServiceRequests) {
      const orgId = sr.organizationId as string;
      srCountByOrg.set(orgId, (srCountByOrg.get(orgId) ?? 0) + 1);
    }

    const topHospitals = await Promise.all(
      Array.from(srCountByOrg.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(async ([orgId, count]) => {
          const org = await ctx.db.get(orgId as Id<"organizations">);
          return {
            organizationId: orgId,
            organizationName: org?.name ?? "Unknown",
            serviceRequestCount: count,
          };
        }),
    );

    // Top providers by average rating
    const allProviders = await ctx.db.query("providers").collect();
    const topProviders = allProviders
      .filter((p) => (p.totalRatings ?? 0) > 0)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
      .slice(0, limit)
      .map((p) => ({
        providerId: p._id as string,
        providerName: p.nameVi,
        providerNameEn: p.nameEn,
        averageRating: p.averageRating ?? 0,
        totalRatings: p.totalRatings ?? 0,
        completedServices: p.completedServices ?? 0,
      }));

    return {
      /** vi: "Bệnh viện hàng đầu" / en: "Top hospitals" */
      topHospitals,
      /** vi: "Nhà cung cấp hàng đầu" / en: "Top providers" */
      topProviders,
    };
  },
});

/**
 * Returns platform health metrics:
 *   - avgQuoteResponseTimeDays: average time from SR creation to first quote (days)
 *   - avgDisputeResolutionTimeDays: average time from dispute creation to resolution (days)
 *
 * vi: "Sức khỏe nền tảng" / en: "Platform health metrics"
 */
export const getPlatformHealth = query({
  args: {},
  handler: async (ctx) => {
    // Auth guard: only platform admins can view cross-tenant platform health data
    await requirePlatformAdmin(ctx);

    // Average quote response time
    const allQuotes = await ctx.db.query("quotes").collect();
    let totalResponseTimeMs = 0;
    let responseTimeCount = 0;

    for (const quote of allQuotes) {
      const sr = await ctx.db.get(quote.serviceRequestId);
      if (sr) {
        totalResponseTimeMs += quote.createdAt - sr.createdAt;
        responseTimeCount += 1;
      }
    }

    const avgQuoteResponseTimeDays =
      responseTimeCount > 0
        ? totalResponseTimeMs / responseTimeCount / (24 * 60 * 60 * 1000)
        : 0;

    // Average dispute resolution time
    const resolvedDisputes = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("status"), "resolved"))
      .collect();

    let totalResolutionTimeMs = 0;
    let resolutionCount = 0;

    for (const dispute of resolvedDisputes) {
      if (dispute.resolvedAt) {
        totalResolutionTimeMs += dispute.resolvedAt - dispute.createdAt;
        resolutionCount += 1;
      }
    }

    const avgDisputeResolutionTimeDays =
      resolutionCount > 0
        ? totalResolutionTimeMs / resolutionCount / (24 * 60 * 60 * 1000)
        : 0;

    return {
      /** vi: "Thời gian phản hồi báo giá trung bình (ngày)" / en: "Avg quote response time (days)" */
      avgQuoteResponseTimeDays,
      /** vi: "Thời gian giải quyết tranh chấp trung bình (ngày)" / en: "Avg dispute resolution time (days)" */
      avgDisputeResolutionTimeDays,
    };
  },
});
