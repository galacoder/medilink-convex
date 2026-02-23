"use client";

/**
 * Hook for loading top hospital relationships for a provider.
 *
 * WHY: Hospital relationship data is loaded separately so it can be
 * independently cached and reactive without affecting the KPI cards.
 *
 * vi: "Hook tải quan hệ bệnh viện" / en: "Hospital relationships hook"
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { HospitalRelationship } from "../types";

export interface UseProviderHospitalRelationshipsOptions {
  providerId: string;
  limit?: number;
}

export interface UseProviderHospitalRelationshipsResult {
  hospitals: HospitalRelationship[];
  isLoading: boolean;
}

/**
 * Returns top hospital relationships sorted by revenue.
 *
 * @param options.providerId - The Convex ID of the provider record.
 * @param options.limit      - Maximum hospitals to return (default 10).
 */
export function useProviderHospitalRelationships(
  options: UseProviderHospitalRelationshipsOptions,
): UseProviderHospitalRelationshipsResult {
  const { providerId, limit = 10 } = options;

  const data = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.analytics.getProviderHospitalRelationships as any,
    providerId ? { providerId, limit } : "skip",
  ) as HospitalRelationship[] | undefined;

  return {
    hospitals: data ?? [],
    isLoading: data === undefined,
  };
}
