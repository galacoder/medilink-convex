"use client";

/**
 * Hook for listing incoming service requests for the authenticated provider.
 *
 * WHY: Wraps api.serviceRequests.listByProvider with optional status filtering
 * and returns typed IncomingServiceRequest[]. Convex useQuery gives real-time
 * reactivity — the UI updates automatically when hospital creates a new request
 * or a request status changes.
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import type { IncomingServiceRequest, ServiceRequestStatus } from "../types";

export interface UseIncomingRequestsOptions {
  status?: ServiceRequestStatus | "all";
}

export interface UseIncomingRequestsResult {
  requests: IncomingServiceRequest[];
  isLoading: boolean;
}

/**
 * Returns incoming service requests visible to the current provider org.
 *
 * @param status - Filter by status. Pass "all" or omit for all statuses.
 */
export function useIncomingRequests(
  status?: ServiceRequestStatus | "all",
): UseIncomingRequestsResult {
  // Convert "all" sentinel to undefined (Convex query uses undefined for no filter)
  const convexStatus =
    status && status !== "all" ? status : undefined;

  const requests = useQuery(api.serviceRequests.listByProvider, {
    ...(convexStatus ? { status: convexStatus } : {}),
  }) as IncomingServiceRequest[] | undefined;

  return {
    requests: requests ?? [],
    isLoading: requests === undefined,
  };
}
