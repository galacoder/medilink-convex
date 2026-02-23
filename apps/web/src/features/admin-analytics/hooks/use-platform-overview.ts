"use client";

/**
 * Hook for loading platform admin overview statistics.
 *
 * WHY: Wraps Convex useQuery(api.admin.analytics.getOverviewStats) with typed
 * return shape and loading state. Provides platform-wide KPI counts.
 *
 * vi: "Hook tải thống kê tổng quan nền tảng" / en: "Platform overview stats hook"
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { PlatformOverviewStats } from "../types";

export interface UsePlatformOverviewResult {
  stats: PlatformOverviewStats | null;
  isLoading: boolean;
}

/**
 * Returns the platform-wide KPI overview stats.
 */
export function usePlatformOverview(): UsePlatformOverviewResult {
  const stats = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getOverviewStats,
    {},
  ) as PlatformOverviewStats | undefined;

  return {
    stats: stats ?? null,
    isLoading: stats === undefined,
  };
}
