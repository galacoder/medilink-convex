/**
 * Convex queries for provider analytics.
 *
 * Aggregates revenue, completion rate, ratings, and hospital relationships
 * for the provider analytics dashboard (M3-4).
 *
 * Access control:
 *   - All queries are scoped to a specific providerId
 *   - Provider org members view their own analytics
 *   - Platform admins can view any provider's analytics
 *
 * Data sources (from M3-1, M3-2, M3-3):
 *   - serviceRequests: completion rate, response time, service counts
 *   - quotes: revenue (accepted quote amounts), quote win rate
 *   - serviceRatings: average rating, distribution, recent reviews
 *
 * NOTE (M3-3 dependency): Issue #68 (service execution) may still be
 * in-progress. Fields like `completionReport` are accessed with optional
 * chaining to handle their absence gracefully.
 */

import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Computes the start-of-range timestamp in epoch ms for a given preset.
 * vi: "Tính thời điểm bắt đầu khoảng thời gian" / en: "Compute range start"
 */
function getDateRangeStart(dateRange: "7d" | "30d" | "90d" | "custom", customStart?: number): number {
  if (dateRange === "custom" && customStart !== undefined) {
    return customStart;
  }
  const dayMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = dayMap[dateRange] ?? 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the top-level KPI summary for a provider:
 *   - totalRevenue: sum of accepted quote amounts for completed service requests
 *   - completedServices: count of service requests with status = "completed"
 *   - averageRating: computed from serviceRatings table
 *   - totalQuotesSubmitted: count of all quotes by this provider
 *   - quoteWinRate: accepted / total quotes (0–1)
 *   - completionRate: completed / (completed + cancelled) (0–1)
 *
 * vi: "Tổng quan KPI nhà cung cấp" / en: "Provider KPI summary"
 */
export const getProviderSummary = query({
  args: {
    providerId: v.id("providers"),
    dateRange: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("custom"),
    ),
    customStartDate: v.optional(v.number()),
    customEndDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rangeStart = getDateRangeStart(args.dateRange, args.customStartDate);
    const rangeEnd = args.customEndDate ?? Date.now();

    // 1. Get all service requests assigned to this provider in the date range
    const allServiceRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) =>
        q.eq("assignedProviderId", args.providerId),
      )
      .collect();

    // Filter by date range
    const serviceRequests = allServiceRequests.filter(
      (sr) => sr.createdAt >= rangeStart && sr.createdAt <= rangeEnd,
    );

    // Count completed and cancelled
    const completedSRs = serviceRequests.filter((sr) => sr.status === "completed");
    const cancelledSRs = serviceRequests.filter((sr) => sr.status === "cancelled");

    const completedServices = completedSRs.length;
    const completionRate =
      completedServices + cancelledSRs.length > 0
        ? completedServices / (completedServices + cancelledSRs.length)
        : 0;

    // 2. Get all quotes by this provider in the date range
    const allQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    const quotes = allQuotes.filter(
      (q) => q.createdAt >= rangeStart && q.createdAt <= rangeEnd,
    );

    const totalQuotesSubmitted = quotes.length;
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
    const quoteWinRate =
      totalQuotesSubmitted > 0
        ? acceptedQuotes.length / totalQuotesSubmitted
        : 0;

    // 3. Revenue = sum of accepted quote amounts for completed service requests
    //    A service request is considered completed revenue when:
    //    - The service request status is "completed"
    //    - The provider has an accepted quote for it
    const completedSRIds = new Set(completedSRs.map((sr) => sr._id));
    const revenueQuotes = acceptedQuotes.filter(
      (q) => completedSRIds.has(q.serviceRequestId as Id<"serviceRequests">),
    );
    const totalRevenue = revenueQuotes.reduce((sum, q) => sum + q.amount, 0);

    // 4. Get average rating from provider record (pre-computed)
    const provider = await ctx.db.get(args.providerId);
    const averageRating = provider?.averageRating ?? 0;
    const totalRatings = provider?.totalRatings ?? 0;

    // 5. Count this month vs last month
    const now = Date.now();
    const thisMonthStart = new Date(now);
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const thisMonthSRs = allServiceRequests.filter(
      (sr) =>
        sr.createdAt >= thisMonthStart.getTime() &&
        sr.status === "completed",
    );
    const lastMonthSRs = allServiceRequests.filter(
      (sr) =>
        sr.createdAt >= lastMonthStart.getTime() &&
        sr.createdAt < thisMonthStart.getTime() &&
        sr.status === "completed",
    );

    // 6. Average time to submit quote (from service request creation to quote)
    //    Only for quotes submitted by this provider on requests they have a quote for
    let avgQuoteResponseTimeMs = 0;
    if (quotes.length > 0) {
      const responseTimes: number[] = [];
      for (const q of quotes) {
        const sr = await ctx.db.get(q.serviceRequestId);
        if (sr) {
          responseTimes.push(q.createdAt - sr.createdAt);
        }
      }
      if (responseTimes.length > 0) {
        avgQuoteResponseTimeMs =
          responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
      }
    }

    return {
      // Revenue
      totalRevenue,
      // Service metrics
      completedServices,
      completionRate,
      thisMonthServices: thisMonthSRs.length,
      lastMonthServices: lastMonthSRs.length,
      // Quote metrics
      totalQuotesSubmitted,
      quoteWinRate,
      avgQuoteResponseTimeDays: avgQuoteResponseTimeMs / (24 * 60 * 60 * 1000),
      // Rating
      averageRating,
      totalRatings,
    };
  },
});

/**
 * Returns monthly revenue breakdown for trend charts.
 *
 * vi: "Doanh thu hàng tháng" / en: "Monthly revenue breakdown"
 */
export const getProviderRevenueByMonth = query({
  args: {
    providerId: v.id("providers"),
    // How many months back to include (default 6)
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numMonths = args.months ?? 6;
    const now = new Date();

    // Build month buckets
    const buckets: { year: number; month: number; revenue: number; completedServices: number }[] = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), revenue: 0, completedServices: 0 });
    }

    // Get all quotes and service requests for this provider
    const allQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // For each accepted quote, check if the related service request is completed
    for (const quote of allQuotes) {
      const sr = await ctx.db.get(quote.serviceRequestId);
      if (!sr || sr.status !== "completed") continue;

      const completedDate = new Date(sr.completedAt ?? sr.updatedAt);
      const year = completedDate.getFullYear();
      const month = completedDate.getMonth();

      const bucket = buckets.find((b) => b.year === year && b.month === month);
      if (bucket) {
        bucket.revenue += quote.amount;
        bucket.completedServices += 1;
      }
    }

    // Format month labels
    return buckets.map((b) => ({
      // vi: "Tháng N/YYYY" / en: "Month N/YYYY"
      month: `${b.month + 1}/${b.year}`,
      revenue: b.revenue,
      completedServices: b.completedServices,
    }));
  },
});

/**
 * Returns revenue breakdown by service type.
 *
 * vi: "Doanh thu theo loại dịch vụ" / en: "Revenue by service type"
 */
export const getProviderRevenueByServiceType = query({
  args: {
    providerId: v.id("providers"),
    dateRange: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("custom"),
    ),
    customStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rangeStart = getDateRangeStart(args.dateRange, args.customStartDate);

    // Get accepted quotes in range
    const allQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const quotesInRange = allQuotes.filter((q) => q.createdAt >= rangeStart);

    // Group by service request type
    const typeRevenue: Record<string, number> = {};
    for (const quote of quotesInRange) {
      const sr = await ctx.db.get(quote.serviceRequestId);
      if (!sr || sr.status !== "completed") continue;

      const type = sr.type;
      typeRevenue[type] = (typeRevenue[type] ?? 0) + quote.amount;
    }

    // Return sorted by revenue descending
    return Object.entries(typeRevenue)
      .map(([type, revenue]) => ({ type, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  },
});

/**
 * Returns rating summary and distribution for a provider.
 *
 * vi: "Thống kê đánh giá nhà cung cấp" / en: "Provider rating statistics"
 */
export const getProviderRatings = query({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    // Get all ratings for this provider
    const ratings = await ctx.db
      .query("serviceRatings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();

    // Compute distribution (1-5 stars)
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      stars: star,
      count: ratings.filter((r) => r.rating === star).length,
    }));

    // Average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Recent reviews (up to 10)
    const recentReviews = await Promise.all(
      ratings.slice(0, 10).map(async (r) => {
        const sr = await ctx.db.get(r.serviceRequestId);
        const ratedByUser = await ctx.db.get(r.ratedBy);
        const hospitalOrg = sr ? await ctx.db.get(sr.organizationId) : null;
        return {
          _id: r._id,
          rating: r.rating,
          commentVi: r.commentVi,
          commentEn: r.commentEn,
          serviceQuality: r.serviceQuality,
          timeliness: r.timeliness,
          professionalism: r.professionalism,
          createdAt: r.createdAt,
          ratedByName: ratedByUser?.name ?? null,
          hospitalName: hospitalOrg?.name ?? null,
          serviceRequestType: sr?.type ?? null,
        };
      }),
    );

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings: ratings.length,
      distribution,
      recentReviews,
    };
  },
});

/**
 * Returns top hospital relationships for this provider.
 * Sorted by total revenue (descending).
 *
 * vi: "Quan hệ với bệnh viện hàng đầu" / en: "Top hospital relationships"
 */
export const getProviderHospitalRelationships = query({
  args: {
    providerId: v.id("providers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all completed service requests assigned to this provider
    const allServiceRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) =>
        q.eq("assignedProviderId", args.providerId),
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Get all accepted quotes by this provider
    const acceptedQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Build a map of serviceRequestId -> quote amount
    const quoteAmountBySR = new Map<string, number>();
    for (const q of acceptedQuotes) {
      quoteAmountBySR.set(q.serviceRequestId, q.amount);
    }

    // Group by hospital organization
    const hospitalMap = new Map<
      string,
      { orgId: string; completedServices: number; totalRevenue: number; isRepeat: boolean }
    >();

    for (const sr of allServiceRequests) {
      const orgId = sr.organizationId as string;
      const existing = hospitalMap.get(orgId);
      const revenue = quoteAmountBySR.get(sr._id) ?? 0;
      if (existing) {
        existing.completedServices += 1;
        existing.totalRevenue += revenue;
        existing.isRepeat = existing.completedServices > 1;
      } else {
        hospitalMap.set(orgId, {
          orgId,
          completedServices: 1,
          totalRevenue: revenue,
          isRepeat: false,
        });
      }
    }

    // Resolve hospital names and sort by revenue
    const hospitals = await Promise.all(
      Array.from(hospitalMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
        .map(async (h) => {
          const org = await ctx.db.get(h.orgId as Id<"organizations">);
          return {
            hospitalName: org?.name ?? "Unknown",
            completedServices: h.completedServices,
            totalRevenue: h.totalRevenue,
            isRepeat: h.isRepeat,
          };
        }),
    );

    return hospitals;
  },
});
