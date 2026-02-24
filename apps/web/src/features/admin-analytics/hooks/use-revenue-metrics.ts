"use client";

/**
 * Hook for loading platform revenue breakdown metrics.
 *
 * WHY: Wraps Convex useQuery(api.admin.analytics.getRevenueMetrics) with typed
 * return shape and loading state. Drives the revenue section in the admin dashboard.
 *
 * vi: "Hook tải chỉ số doanh thu" / en: "Revenue metrics hook"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { RevenueMetrics } from "../types";

export interface UseRevenueMetricsOptions {
  limit?: number;
}

export interface UseRevenueMetricsResult {
  revenueMetrics: RevenueMetrics | null;
  isLoading: boolean;
}

/**
 * Returns platform-wide revenue breakdown by hospital and provider.
 *
 * @param options.limit - Max number of hospitals/providers to return (default 10)
 */
export function useRevenueMetrics(
  options: UseRevenueMetricsOptions = {},
): UseRevenueMetricsResult {
  const { limit = 10 } = options;

  const revenueMetrics = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getRevenueMetrics,
    { limit },
  ) as RevenueMetrics | undefined;

  return {
    revenueMetrics: revenueMetrics ?? null,
    isLoading: revenueMetrics === undefined,
  };
}
