"use client";

/**
 * Platform admin analytics dashboard page.
 *
 * WHY: Platform admins (SangLeTech staff) need a real-time view of platform-wide
 * metrics to monitor business health, identify trends, and make data-driven
 * decisions about hospital/provider partnerships and platform scaling.
 *
 * Data flow:
 *   1. usePlatformOverview → total hospitals, providers, equipment, SRs, revenue
 *   2. useGrowthMetrics    → new hospitals/providers per month (growth chart)
 *   3. useServiceMetrics   → service request volume + completion rate trend
 *   4. useRevenueMetrics   → total revenue, avg value, by hospital, by provider
 *   5. useTopPerformers    → top 5 hospitals by activity, top 5 providers by rating
 *   6. (Inline) usePlatformHealth → avg quote response time, avg dispute resolution
 *   7. usePlatformAnalyticsExport → CSV download of all metrics
 *
 * NOTE (M4 dependencies): M4-1 (hospitals), M4-2 (providers management), M4-3
 * (service requests management) are being implemented in parallel. This page
 * builds against the current schema and all data is pulled from existing tables.
 *
 * vi: "Trang phân tích nền tảng quản trị" / en: "Platform admin analytics dashboard"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { PlatformHealthMetrics } from "~/features/admin-analytics/types";
import { GrowthChart } from "~/features/admin-analytics/components/growth-chart";
import { OverviewStatsCards } from "~/features/admin-analytics/components/overview-stats-cards";
import { PlatformHealthCard } from "~/features/admin-analytics/components/platform-health-card";
import { RevenueBreakdownTable } from "~/features/admin-analytics/components/revenue-breakdown-table";
import { ServiceVolumeChart } from "~/features/admin-analytics/components/service-volume-chart";
import { TopPerformersTable } from "~/features/admin-analytics/components/top-performers-table";
import { useGrowthMetrics } from "~/features/admin-analytics/hooks/use-growth-metrics";
import { usePlatformAnalyticsExport } from "~/features/admin-analytics/hooks/use-platform-analytics-export";
import { usePlatformOverview } from "~/features/admin-analytics/hooks/use-platform-overview";
import { useRevenueMetrics } from "~/features/admin-analytics/hooks/use-revenue-metrics";
import { useServiceMetrics } from "~/features/admin-analytics/hooks/use-service-metrics";
import { useTopPerformers } from "~/features/admin-analytics/hooks/use-top-performers";
import { adminAnalyticsLabels } from "~/features/admin-analytics/labels";

/**
 * Platform analytics dashboard — real-time platform-wide KPIs for SangLeTech admins.
 */
export default function PlatformAnalyticsPage() {
  // Load all analytics data in parallel via Convex useQuery
  const { stats, isLoading: overviewLoading } = usePlatformOverview();
  const { growthMetrics, isLoading: growthLoading } = useGrowthMetrics({
    months: 6,
  });
  const { serviceMetrics, isLoading: serviceLoading } = useServiceMetrics({
    months: 6,
  });
  const { revenueMetrics, isLoading: revenueLoading } = useRevenueMetrics({
    limit: 10,
  });
  const { topPerformers, isLoading: performersLoading } = useTopPerformers({
    limit: 5,
  });

  // Load platform health metrics (inline since it's a simple query)
  const healthMetrics = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getPlatformHealth,
    {},
  ) as PlatformHealthMetrics | undefined;
  const healthLoading = healthMetrics === undefined;

  const { exportToCSV, isExporting } = usePlatformAnalyticsExport();

  const labels = adminAnalyticsLabels;

  function handleExport() {
    exportToCSV(
      {
        overview: stats,
        revenueMetrics: revenueMetrics,
        topPerformers: topPerformers,
      },
      `platform-analytics-${new Date().toISOString().slice(0, 10)}`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {/* vi: "Phân tích nền tảng" / en: "Platform Analytics" */}
            {labels.page.title.vi}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {/* vi: "Tổng quan về bệnh viện, nhà cung cấp, doanh thu và khối lượng dịch vụ" */}
            {labels.page.description.vi}
          </p>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || overviewLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          aria-label={labels.export.button.vi}
        >
          {
            isExporting
              ? labels.export.exporting.vi /* en: "Exporting..." */
              : labels.export.button.vi /* en: "Export CSV" */
          }
        </button>
      </div>

      {/* Section 1: Platform overview KPI cards */}
      <section aria-label={labels.overview.title.vi}>
        <OverviewStatsCards stats={stats} isLoading={overviewLoading} />
      </section>

      {/* Section 2: Growth charts (hospitals and providers per month) */}
      <section aria-label={labels.growth.title.vi}>
        <GrowthChart
          hospitalGrowth={growthMetrics?.hospitalGrowth ?? []}
          providerGrowth={growthMetrics?.providerGrowth ?? []}
          isLoading={growthLoading}
        />
      </section>

      {/* Section 3: Service volume + completion rate charts */}
      <section aria-label={labels.services.title.vi}>
        <ServiceVolumeChart
          monthlyVolume={serviceMetrics?.monthlyVolume ?? []}
          overallCompletionRate={serviceMetrics?.overallCompletionRate ?? 0}
          isLoading={serviceLoading}
        />
      </section>

      {/* Section 4: Revenue breakdown (total revenue, by hospital, by provider) */}
      <section aria-label={labels.revenue.title.vi}>
        <RevenueBreakdownTable
          revenueByHospital={revenueMetrics?.revenueByHospital ?? []}
          revenueByProvider={revenueMetrics?.revenueByProvider ?? []}
          totalRevenue={revenueMetrics?.totalRevenue ?? 0}
          averageServiceValue={revenueMetrics?.averageServiceValue ?? 0}
          isLoading={revenueLoading}
        />
      </section>

      {/* Section 5: Top performers (top hospitals by activity, top providers by rating) */}
      <section aria-label={labels.topPerformers.title.vi}>
        <TopPerformersTable
          topHospitals={topPerformers?.topHospitals ?? []}
          topProviders={topPerformers?.topProviders ?? []}
          isLoading={performersLoading}
        />
      </section>

      {/* Section 6: Platform health (avg response time, avg resolution time) */}
      <section aria-label={labels.health.title.vi}>
        <PlatformHealthCard
          healthMetrics={healthMetrics ?? null}
          isLoading={healthLoading}
        />
      </section>
    </div>
  );
}
