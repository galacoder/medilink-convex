"use client";

/**
 * Hook for service request notification badge counts.
 *
 * WHY: The nav sidebar needs a badge count showing how many service requests
 * need attention (new quotes waiting for approval). This hook queries the
 * "quoted" status requests and returns a count for the badge indicator.
 *
 * Only queries when the user is authenticated AND has an active organization
 * (Convex handles auth via the ConvexBetterAuthProvider). Platform admins
 * have no active org so we skip the query to avoid NO_ACTIVE_ORGANIZATION errors.
 */
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { ServiceRequest } from "../types";
import { useActiveOrganization } from "~/auth/client";

export interface UseServiceRequestNotificationsResult {
  /** Number of requests in "quoted" status (need quote review) */
  quotedCount: number;
  /** Total badge count (quoted requests = most actionable) */
  totalBadge: number;
}

export function useServiceRequestNotifications(): UseServiceRequestNotificationsResult {
  const { data: activeOrg } = useActiveOrganization();

  // Query all quoted requests (these need hospital action — accept/reject a quote).
  // Skip when there's no active org (e.g. platform_admin) to avoid
  // NO_ACTIVE_ORGANIZATION errors from requireOrgAuth in the Convex handler.
  // WHY "skip" string: convex@1.31.7 uses the "skip" sentinel string instead of SKIP_TOKEN
  // (SKIP_TOKEN was introduced in a later convex release).
  const quotedRequests = useQuery(
    api.serviceRequests.listByHospital,
    activeOrg ? { status: "quoted" } : "skip",
  ) as ServiceRequest[] | undefined;

  const quotedCount = quotedRequests?.length ?? 0;

  return {
    quotedCount,
    totalBadge: quotedCount,
  };
}
