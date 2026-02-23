"use client";

/**
 * Hook for loading monthly revenue breakdown for the revenue trend chart.
 *
 * WHY: Separating the monthly revenue data from the summary allows the
 * revenue chart to load independently and cache its data separately.
 *
 * vi: "Hook tải doanh thu hàng tháng" / en: "Monthly revenue data hook"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/db/api";

import type { MonthlyRevenue } from "../types";

export interface UseProviderRevenueOptions {
  providerId: string;
  months?: number;
}

export interface UseProviderRevenueResult {
  monthlyRevenue: MonthlyRevenue[];
  isLoading: boolean;
}

/**
 * Returns monthly revenue data for a provider, going back N months.
 *
 * @param options.providerId - The Convex ID of the provider record.
 * @param options.months     - Number of months to include (default 6).
 */
export function useProviderRevenue(
  options: UseProviderRevenueOptions,
): UseProviderRevenueResult {
  const { providerId, months = 6 } = options;

  const data = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.analytics.getProviderRevenueByMonth as any,
    providerId ? { providerId, months } : "skip",
  ) as MonthlyRevenue[] | undefined;

  return {
    monthlyRevenue: data ?? [],
    isLoading: data === undefined,
  };
}
