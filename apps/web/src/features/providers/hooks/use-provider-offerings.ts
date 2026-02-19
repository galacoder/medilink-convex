"use client";

/**
 * Hook for listing service offerings for the authenticated provider organization.
 *
 * WHY: Wraps Convex useQuery(api.providers.listServiceOfferings) with typed
 * return shape and loading state. Real-time reactivity via Convex means the
 * list updates automatically when offerings are added, updated, or removed.
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import type { ServiceOffering } from "../types";

export interface UseProviderOfferingsOptions {
  organizationId: string;
}

export interface UseProviderOfferingsResult {
  offerings: ServiceOffering[];
  isLoading: boolean;
}

/**
 * Returns the list of service offerings for the given provider organization.
 *
 * @param organizationId - The organization ID of the provider.
 */
export function useProviderOfferings(
  organizationId: string,
): UseProviderOfferingsResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offerings = useQuery(
    api.providers.listServiceOfferings as any,
    organizationId ? { organizationId } : "skip",
  ) as ServiceOffering[] | undefined;

  return {
    offerings: offerings ?? [],
    isLoading: offerings === undefined,
  };
}
