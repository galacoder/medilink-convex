"use client";

/**
 * Hook for loading provider analytics summary (KPI metrics).
 *
 * WHY: Wraps Convex useQuery(api.analytics.getProviderSummary) with typed
 * return shape and loading state. Supports all date range presets.
 *
 * vi: "Hook tải dữ liệu phân tích nhà cung cấp" / en: "Provider analytics data hook"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/db/api";

export interface ProviderAnalyticsSummary {
  // Revenue
  totalRevenue: number;
  // Service metrics
  completedServices: number;
  completionRate: number;
  thisMonthServices: number;
  lastMonthServices: number;
  // Quote metrics
  totalQuotesSubmitted: number;
  quoteWinRate: number;
  avgQuoteResponseTimeDays: number;
  // Rating
  averageRating: number;
  totalRatings: number;
}

export interface UseProviderAnalyticsOptions {
  providerId: string;
  dateRange: "7d" | "30d" | "90d" | "custom";
  customStartDate?: number;
  customEndDate?: number;
}

export interface UseProviderAnalyticsResult {
  summary: ProviderAnalyticsSummary | null;
  isLoading: boolean;
}

/**
 * Returns the KPI summary for a provider organization.
 *
 * @param options.providerId - The Convex ID of the provider record.
 * @param options.dateRange  - Preset range (7d, 30d, 90d) or "custom".
 */
export function useProviderAnalytics(
  options: UseProviderAnalyticsOptions,
): UseProviderAnalyticsResult {
  const { providerId, dateRange, customStartDate, customEndDate } = options;

  const summary = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.analytics.getProviderSummary as any,
    providerId
      ? { providerId, dateRange, customStartDate, customEndDate }
      : "skip",
  ) as ProviderAnalyticsSummary | undefined;

  return {
    summary: summary ?? null,
    isLoading: summary === undefined,
  };
}
