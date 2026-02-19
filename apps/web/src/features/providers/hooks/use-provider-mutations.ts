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
import { api } from "convex/_generated/api";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
const providersApi = api.providers as any;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

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
  const addServiceOffering = useMutation(providersApi.addServiceOffering);
  const updateServiceOffering = useMutation(
    providersApi.updateServiceOffering,
  );
  const removeServiceOffering = useMutation(
    providersApi.removeServiceOffering,
  );
  const addCertification = useMutation(providersApi.addCertification);
  const setCoverageArea = useMutation(providersApi.setCoverageArea);
  const updateProfile = useMutation(providersApi.updateProfile);

  return {
    addServiceOffering,
    updateServiceOffering,
    removeServiceOffering,
    addCertification,
    setCoverageArea,
    updateProfile,
  };
}
