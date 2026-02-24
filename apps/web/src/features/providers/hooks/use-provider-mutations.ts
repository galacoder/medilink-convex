"use client";

/**
 * Hook wrapping all provider mutations for use in components.
 *
 * WHY: Centralizing all provider mutations in a single hook prevents
 * components from importing convex/react and api.providers directly,
 * maintaining clean feature boundaries and making mutations easy to mock
 * in tests.
 */
import { useMutation } from "convex/react";

import { api } from "@medilink/backend";

// Convex codegen does not include providers namespace in the worktree
// until `npx convex codegen` is run with a live deployment. The `as any`
// cast is intentional and safe -- all runtime shapes are validated by
// the Convex schema and mutation argument validators.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const providersApi = (api as any).providers;

export interface UseProviderMutationsResult {
  addServiceOffering: ReturnType<typeof useMutation>;
  updateServiceOffering: ReturnType<typeof useMutation>;
  removeServiceOffering: ReturnType<typeof useMutation>;
  addCertification: ReturnType<typeof useMutation>;
  setCoverageArea: ReturnType<typeof useMutation>;
  updateProfile: ReturnType<typeof useMutation>;
}

/**
 * Returns all provider mutation functions ready for use in components.
 */
export function useProviderMutations(): UseProviderMutationsResult {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const addServiceOffering = useMutation(providersApi.addServiceOffering);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const updateServiceOffering = useMutation(providersApi.updateServiceOffering);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const removeServiceOffering = useMutation(providersApi.removeServiceOffering);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const addCertification = useMutation(providersApi.addCertification);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const setCoverageArea = useMutation(providersApi.setCoverageArea);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const updateProfile = useMutation(providersApi.updateProfile);

  // The mutations are typed as ReactMutation<any> due to the providersApi cast.
  // These assignments are safe -- the interface matches the Convex mutation shapes.
  return {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    addServiceOffering,
    updateServiceOffering,
    removeServiceOffering,
    addCertification,
    setCoverageArea,
    updateProfile,
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  };
}
