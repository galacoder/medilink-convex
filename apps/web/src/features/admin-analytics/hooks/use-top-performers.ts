"use client";

/**
 * Hook for loading platform top performers (top hospitals and top providers).
 *
 * WHY: Wraps Convex useQuery(api.admin.analytics.getTopPerformers) with typed
 * return shape and loading state. Drives the top performers section in the admin dashboard.
 *
 * vi: "Hook tải đơn vị hàng đầu" / en: "Top performers hook"
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { TopPerformers } from "../types";

export interface UseTopPerformersOptions {
  limit?: number;
}

export interface UseTopPerformersResult {
  topPerformers: TopPerformers | null;
  isLoading: boolean;
}

/**
 * Returns top hospitals (by activity) and top providers (by rating).
 *
 * @param options.limit - Max number of performers per list (default 5)
 */
export function useTopPerformers(
  options: UseTopPerformersOptions = {},
): UseTopPerformersResult {
  const { limit = 5 } = options;

  const topPerformers = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (api as any).admin.analytics.getTopPerformers,
    { limit },
  ) as TopPerformers | undefined;

  return {
    topPerformers: topPerformers ?? null,
    isLoading: topPerformers === undefined,
  };
}
