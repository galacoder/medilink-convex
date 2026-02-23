"use client";

/**
 * Hook for fetching a single service request with full related data.
 *
 * WHY: Wraps useQuery(api.serviceRequests.getById) which returns the full
 * enriched object including equipment details, all quotes with provider names,
 * and the rating if completed. The real-time subscription ensures the detail
 * page updates when a provider submits a quote or status transitions.
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { ServiceRequestDetail } from "../types";

export interface UseServiceRequestDetailResult {
  detail: ServiceRequestDetail | null | undefined;
  isLoading: boolean;
  notFound: boolean;
}

/**
 * Returns full detail for a service request by ID.
 *
 * @param id - The Convex service request ID string.
 * Returns undefined while loading, null if not found/error, or the detail object.
 */
export function useServiceRequestDetail(
  id: string | null | undefined,
): UseServiceRequestDetailResult {
  // Skip the query if no ID is provided
  const result = useQuery(
    api.serviceRequests.getById,
    id ? ({ id } as { id: string }) : "skip",
  ) as ServiceRequestDetail | null | undefined;

  return {
    detail: result,
    isLoading: id != null && result === undefined,
    notFound: result === null,
  };
}
