"use client";

/**
 * Hook for loading provider rating distribution and recent reviews.
 *
 * WHY: Ratings data loads separately from the KPI summary to allow
 * the rating chart to be independently reactive and cacheable.
 *
 * vi: "Hook tải dữ liệu đánh giá nhà cung cấp" / en: "Provider ratings data hook"
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { ProviderRatings } from "../types";

export interface UseProviderRatingsOptions {
  providerId: string;
}

export interface UseProviderRatingsResult {
  ratingsData: ProviderRatings | null;
  isLoading: boolean;
}

/**
 * Returns rating distribution and recent reviews for a provider.
 *
 * @param options.providerId - The Convex ID of the provider record.
 */
export function useProviderRatings(
  options: UseProviderRatingsOptions,
): UseProviderRatingsResult {
  const { providerId } = options;

  const data = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    api.analytics.getProviderRatings as any,
    providerId ? { providerId } : "skip",
  ) as ProviderRatings | undefined;

  return {
    ratingsData: data ?? null,
    isLoading: data === undefined,
  };
}
