"use client";

/**
 * Hook for fetching provider profile and certifications.
 *
 * WHY: Wraps Convex useQuery calls for getProfile and getCertifications into
 * a single composable hook. Returns combined loading state so components
 * don't need to handle two separate loading flags.
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

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
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
  const profile = useQuery(
    (api.providers as any).getProfile,
    organizationId ? { organizationId } : "skip",
  ) as ProviderProfile | null | undefined;

  const certifications = useQuery(
    (api.providers as any).getCertifications,
    organizationId ? { organizationId } : "skip",
  ) as Certification[] | undefined;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

  const isLoading = profile === undefined || certifications === undefined;

  return {
    profile: profile ?? null,
    certifications: certifications ?? [],
    isLoading,
  };
}
