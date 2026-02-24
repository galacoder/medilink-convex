"use client";

/**
 * Hook for listing service offerings for the authenticated provider organization.
 *
 * WHY: Wraps Convex useQuery(api.providers.listServiceOfferings) with typed
 * return shape and loading state. Real-time reactivity via Convex means the
 * list updates automatically when offerings are added, updated, or removed.
 */
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

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
  // Convex codegen does not include providers namespace locally -- cast is safe,
  // all argument shapes are validated by the Convex schema.
  const offerings = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    api.providers.listServiceOfferings as any,
    organizationId ? { organizationId } : "skip",
  ) as ServiceOffering[] | undefined;

  return {
    offerings: offerings ?? [],
    isLoading: offerings === undefined,
  };
}
