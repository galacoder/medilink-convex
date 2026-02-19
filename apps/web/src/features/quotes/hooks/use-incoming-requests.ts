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
  // WHY: Convex useQuery returns null when the query handler throws a ConvexError.
  // This is distinct from undefined (loading). hasError=true means the server
  // denied access or encountered an error — show error UI instead of empty list.
  hasError: boolean;
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

  // Convex useQuery returns:
  //   undefined = loading (not yet received response)
  //   null      = query threw an error (ConvexError, permission denied, etc.)
  //   T[]       = success
  const result = useQuery(api.serviceRequests.listByProvider, {
    ...(convexStatus ? { status: convexStatus } : {}),
  }) as IncomingServiceRequest[] | null | undefined;

  const isLoading = result === undefined;
  const hasError = result === null;
  const requests = isLoading || hasError ? [] : result;

  return {
    requests,
    isLoading,
    hasError,
  };
}
