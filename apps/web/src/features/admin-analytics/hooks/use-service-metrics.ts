"use client";

/**
 * Hook for loading platform service volume metrics.
 *
 * WHY: Wraps Convex useQuery(api.admin.analytics.getServiceMetrics) with typed
 * return shape and loading state. Drives the service volume chart and completion
 * rate trend in the admin dashboard.
 *
 * vi: "Hook tải chỉ số dịch vụ" / en: "Service metrics hook"
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { ServiceMetrics } from "../types";

export interface UseServiceMetricsOptions {
  months?: number;
}

export interface UseServiceMetricsResult {
  serviceMetrics: ServiceMetrics | null;
  isLoading: boolean;
}

/**
 * Returns monthly service volume and completion rate trend.
 *
 * @param options.months - Number of months to include (default 6)
 */
export function useServiceMetrics(
  options: UseServiceMetricsOptions = {},
): UseServiceMetricsResult {
  const { months = 6 } = options;

  const serviceMetrics = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getServiceMetrics,
    { months },
  ) as ServiceMetrics | undefined;

  return {
    serviceMetrics: serviceMetrics ?? null,
    isLoading: serviceMetrics === undefined,
  };
}
