"use client";

/**
 * Hook for service request notification badge counts.
 *
 * WHY: The nav sidebar needs a badge count showing how many service requests
 * need attention (new quotes waiting for approval). This hook queries the
 * "quoted" status requests and returns a count for the badge indicator.
 *
 * Only queries when the user is authenticated (Convex handles auth via
 * the ConvexBetterAuthProvider).
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import type { ServiceRequest } from "../types";

export interface UseServiceRequestNotificationsResult {
  /** Number of requests in "quoted" status (need quote review) */
  quotedCount: number;
  /** Total badge count (quoted requests = most actionable) */
  totalBadge: number;
}

export function useServiceRequestNotifications(): UseServiceRequestNotificationsResult {
  // Query all quoted requests (these need hospital action — accept/reject a quote)
  const quotedRequests = useQuery(api.serviceRequests.listByHospital, {
    status: "quoted",
  });

  const quotedCount = (quotedRequests as ServiceRequest[] | undefined)?.length ?? 0;

  return {
    quotedCount,
    totalBadge: quotedCount,
  };
}
