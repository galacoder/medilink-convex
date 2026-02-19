"use client";

/**
 * Hook for listing service requests for the authenticated hospital organization.
 *
 * WHY: Wraps the Convex useQuery(api.serviceRequests.listByHospital) with a
 * status filter parameter. Returns typed list with loading state. Using Convex
 * useQuery gives real-time reactivity — the UI updates automatically when a
 * provider submits a quote or status changes.
 */
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { ServiceRequest, ServiceRequestStatus } from "../types";

export interface UseServiceRequestsOptions {
  status?: ServiceRequestStatus | "all";
}

export interface UseServiceRequestsResult {
  requests: ServiceRequest[];
  isLoading: boolean;
}

/**
 * Returns the list of service requests for the current hospital org.
 *
 * @param status - Filter by status. Pass "all" or omit for all statuses.
 */
export function useServiceRequests(
  status?: ServiceRequestStatus | "all",
): UseServiceRequestsResult {
  // Convex query: pass status arg only when filtering a specific status
  const convexStatus = status && status !== "all" ? status : undefined;

  const requests = useQuery(api.serviceRequests.listByHospital, {
    ...(convexStatus ? { status: convexStatus } : {}),
  }) as ServiceRequest[] | undefined;

  return {
    requests: requests ?? [],
    isLoading: requests === undefined,
  };
}
