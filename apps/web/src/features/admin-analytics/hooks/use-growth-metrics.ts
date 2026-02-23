"use client";

/**
 * Hook for loading platform growth metrics (hospital/provider monthly counts).
 *
 * WHY: Wraps Convex useQuery(api.admin.analytics.getGrowthMetrics) with typed
 * return shape and loading state. Drives the growth charts in the admin dashboard.
 *
 * vi: "Hook tải chỉ số tăng trưởng" / en: "Growth metrics hook"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/db/api";

import type { GrowthMetrics } from "../types";

export interface UseGrowthMetricsOptions {
  months?: number;
}

export interface UseGrowthMetricsResult {
  growthMetrics: GrowthMetrics | null;
  isLoading: boolean;
}

/**
 * Returns monthly hospital and provider growth metrics.
 *
 * @param options.months - Number of months to include in growth chart (default 6)
 */
export function useGrowthMetrics(
  options: UseGrowthMetricsOptions = {},
): UseGrowthMetricsResult {
  const { months = 6 } = options;

  const growthMetrics = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getGrowthMetrics,
    { months },
  ) as GrowthMetrics | undefined;

  return {
    growthMetrics: growthMetrics ?? null,
    isLoading: growthMetrics === undefined,
  };
}
