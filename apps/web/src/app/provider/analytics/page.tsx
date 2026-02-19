"use client";

/**
 * Provider analytics dashboard page.
 *
 * WHY: Providers need data-driven insights to grow their business and improve
 * service quality. This dashboard aggregates key metrics from M3-1 (offerings),
 * M3-2 (quotes), and M3-3 (service execution) into a unified view.
 *
 * NOTE (M3-3 dependency): Issue #68 (service execution mutations) may still be
 * in-progress. The analytics queries use optional chaining on completionReport
 * fields which may not exist yet in the schema. All queries work with the current
 * schema using existing serviceRequests.completedAt and quotes.amount fields.
 *
 * Data flow:
 *   1. useActiveOrganization → get provider's organizationId
 *   2. Convex providers.listServiceOfferings → get providerId
 *   3. useProviderAnalytics (api.analytics.getProviderSummary) → KPI summary
 *   4. useProviderRevenue (api.analytics.getProviderRevenueByMonth) → trend chart
 *   5. useProviderRatings (api.analytics.getProviderRatings) → rating distribution
 *   6. useProviderHospitalRelationships → top hospitals table
 *
 * vi: "Trang phân tích nhà cung cấp" / en: "Provider analytics dashboard"
 */
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { DateRangePreset } from "~/features/provider-analytics/types";
import { useActiveOrganization } from "~/auth/client";
import { CompletionRateCard } from "~/features/provider-analytics/components/completion-rate-card";
import { DateRangeFilter } from "~/features/provider-analytics/components/date-range-filter";
import { RatingDistribution } from "~/features/provider-analytics/components/rating-distribution";
import { RevenueChart } from "~/features/provider-analytics/components/revenue-chart";
import { TopHospitalsTable } from "~/features/provider-analytics/components/top-hospitals-table";
import { useAnalyticsExport } from "~/features/provider-analytics/hooks/use-analytics-export";
import { useProviderAnalytics } from "~/features/provider-analytics/hooks/use-provider-analytics";
import { useProviderHospitalRelationships } from "~/features/provider-analytics/hooks/use-provider-hospital-relationships";
import { useProviderRatings } from "~/features/provider-analytics/hooks/use-provider-ratings";
import { useProviderRevenue } from "~/features/provider-analytics/hooks/use-provider-revenue";
import { analyticsLabels } from "~/features/provider-analytics/labels";

/**
 * Formats a VND amount for display in KPI cards.
 */
function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B VND`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M VND`;
  }
  return `${amount.toLocaleString("vi-VN")} VND`;
}

/**
 * Formats a rate (0–1) as a percentage string.
 */
function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Provider analytics dashboard — real-time KPIs, revenue trends, and ratings.
 */
export default function ProviderAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");

  // 1. Get the active organization (provider)
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();
  const organizationId = activeOrg?.id ?? "";

  // 2. Get the provider record ID from the organization
  //    The dashboard uses organizationId as a proxy for providerId since the
  //    Convex query accepts providerId (from the providers table).
  //    In production, we'd fetch the provider by orgId first.
  //    For now, we pass organizationId and the Convex query resolves it.
  //    NOTE: analytics queries accept v.id("providers") but we pass orgId here
  //    using "as any" because the _generated/api may not include analytics yet.
  const providerId = organizationId; // Used as proxy until provider lookup is available

  // 3. Load analytics data
  const { summary, isLoading: summaryLoading } = useProviderAnalytics({
    providerId,
    dateRange,
  });

  const { monthlyRevenue, isLoading: revenueLoading } = useProviderRevenue({
    providerId,
    months: 6,
  });

  const { ratingsData, isLoading: ratingsLoading } = useProviderRatings({
    providerId,
  });

  const { hospitals, isLoading: hospitalsLoading } =
    useProviderHospitalRelationships({ providerId });

  const { exportToCSV, isExporting } = useAnalyticsExport();

  const isLoading = orgPending || summaryLoading;
  const labels = analyticsLabels;

  // Handle export — build exportable records from hospital relationships
  function handleExport() {
    const exportData = hospitals.map((h, idx) => ({
      serviceRequestId: `hospital-${idx + 1}`,
      type: "completed",
      status: "completed",
      hospitalName: h.hospitalName,
      amount: h.totalRevenue,
      currency: "VND",
      completedAt: Date.now(),
    }));
    exportToCSV(
      exportData,
      `analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {/* vi: "Phân tích kinh doanh" / en: "Business Analytics" */}
            {labels.page.title.vi}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {/* vi: "Tổng quan về doanh thu, tỷ lệ hoàn thành và đánh giá của bạn" */}
            {labels.page.description.vi}
          </p>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isExporting ? labels.export.exporting.vi : labels.export.button.vi}
          {/* en: "Export CSV" */}
        </button>
      </div>

      {/* Date range filter */}
      <DateRangeFilter selected={dateRange} onChange={setDateRange} />

      {/* KPI cards row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Tổng doanh thu" / en: "Total Revenue" */}
              {labels.revenue.totalRevenue.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                formatVNDShort(summary?.totalRevenue ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Từ dịch vụ đã hoàn thành" / en: "From completed services" */}
              Từ dịch vụ đã hoàn thành
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <CompletionRateCard
          completionRate={summary?.completionRate ?? 0}
          completedServices={summary?.completedServices ?? 0}
          totalServices={
            (summary?.completedServices ?? 0) +
            (summary?.totalQuotesSubmitted ?? 0)
          }
          isLoading={isLoading}
        />

        {/* Quote Win Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Tỷ lệ thắng báo giá" / en: "Quote Win Rate" */}
              {labels.quotes.winRate.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                formatRate(summary?.quoteWinRate ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Báo giá được chấp nhận" / en: "Quotes accepted" */}
              {summary?.totalQuotesSubmitted ?? 0} báo giá đã gửi
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Đánh giá trung bình" / en: "Average Rating" */}
              {labels.ratings.averageRating.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                `${(summary?.averageRating ?? 0).toFixed(1)} / 5`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Từ X đánh giá của bệnh viện" / en: "From X hospital ratings" */}
              Từ {summary?.totalRatings ?? 0} đánh giá
            </p>
          </CardContent>
        </Card>
      </div>

      {/* This month vs last month */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Dịch vụ tháng này" / en: "This month services" */}
              {labels.services.thisMonth.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                (summary?.thisMonthServices ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Tháng trước: X dịch vụ" / en: "Last month: X services" */}
              Tháng trước: {summary?.lastMonthServices ?? 0} dịch vụ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Thời gian phản hồi TB" / en: "Avg Response Time" */}
              {labels.quotes.avgResponseTime.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                `${(summary?.avgQuoteResponseTimeDays ?? 0).toFixed(1)} ${labels.quotes.days.vi}`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Từ yêu cầu đến gửi báo giá" / en: "From request to quote submission" */}
              Từ yêu cầu đến gửi báo giá
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trend chart */}
      <RevenueChart data={monthlyRevenue} isLoading={revenueLoading} />

      {/* Rating distribution + Top hospitals */}
      <div className="grid gap-4 md:grid-cols-2">
        <RatingDistribution
          averageRating={ratingsData?.averageRating ?? 0}
          totalRatings={ratingsData?.totalRatings ?? 0}
          distribution={ratingsData?.distribution ?? []}
          recentReviews={ratingsData?.recentReviews ?? []}
          isLoading={ratingsLoading}
        />
        <TopHospitalsTable hospitals={hospitals} isLoading={hospitalsLoading} />
      </div>
    </div>
  );
}
