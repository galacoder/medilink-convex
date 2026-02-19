"use client";

/**
 * Hook for listing active services for the authenticated provider organization.
 *
 * WHY: Wraps api.serviceRequests.listActiveServices with derived state:
 *   - scheduledServices: accepted requests (not yet started)
 *   - onSiteServices: in_progress requests (currently being worked on)
 * Real-time via Convex useQuery — updates as hospital/provider change status.
 *
 * Mobile-optimized: provider staff use this on-site from phone/tablet.
 *
 * vi: "Hook lấy danh sách dịch vụ đang hoạt động" / en: "Active services hook"
 */
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { ActiveService } from "../types";

export interface UseActiveServicesResult {
  services: ActiveService[];
  scheduledServices: ActiveService[];
  onSiteServices: ActiveService[];
  isLoading: boolean;
  // WHY: Convex useQuery returns null when the query handler throws a ConvexError.
  // This is distinct from undefined (loading). hasError=true means the server
  // denied access — show error UI instead of empty list.
  hasError: boolean;
  totalCount: number;
}

/**
 * Returns active services (accepted + in_progress) for the current provider org.
 * Services are sorted by scheduledAt (earliest first).
 */
export function useActiveServices(): UseActiveServicesResult {
  // Convex useQuery returns:
  //   undefined = loading (not yet received response)
  //   null      = query threw an error (ConvexError, permission denied, etc.)
  //   T[]       = success
  const result = useQuery(api.serviceRequests.listActiveServices) as
    | ActiveService[]
    | null
    | undefined;

  const isLoading = result === undefined;
  const hasError = result === null;
  const services = isLoading || hasError ? [] : result;

  // Separate by execution status for the two-section mobile layout
  const scheduledServices = services.filter((s) => s.status === "accepted");
  const onSiteServices = services.filter((s) => s.status === "in_progress");

  return {
    services,
    scheduledServices,
    onSiteServices,
    isLoading,
    hasError,
    totalCount: services.length,
  };
}
