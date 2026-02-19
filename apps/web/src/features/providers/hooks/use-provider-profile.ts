"use client";

/**
 * Hook for fetching provider profile and certifications.
 *
 * WHY: Wraps Convex useQuery calls for getProfile and getCertifications into
 * a single composable hook. Returns combined loading state so components
 * don't need to handle two separate loading flags.
 */
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { Certification, ProviderProfile } from "../types";

export interface UseProviderProfileResult {
  profile: ProviderProfile | null;
  certifications: Certification[];
  isLoading: boolean;
}

/**
 * Returns the provider profile and certifications for the given organization.
 *
 * @param organizationId - The organization ID of the provider.
 */
export function useProviderProfile(
  organizationId: string,
): UseProviderProfileResult {
  // Convex codegen does not include providers namespace locally -- cast is safe,
  // all argument shapes are validated by the Convex schema.
  const profile = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.providers.getProfile as any,
    organizationId ? { organizationId } : "skip",
  ) as ProviderProfile | null | undefined;

  const certifications = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.providers.getCertifications as any,
    organizationId ? { organizationId } : "skip",
  ) as Certification[] | undefined;

  const isLoading = profile === undefined || certifications === undefined;

  return {
    profile: profile ?? null,
    certifications: certifications ?? [],
    isLoading,
  };
}
