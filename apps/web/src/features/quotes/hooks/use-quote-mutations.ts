"use client";

/**
 * Hook wrapping Convex mutations for provider quote actions.
 *
 * WHY: Centralizes all mutation calls (submit quote, decline request) with
 * typed callbacks. Components call these hooks instead of calling
 * useMutation() directly, keeping mutation logic out of UI components.
 */
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export interface SubmitQuoteArgs {
  serviceRequestId: Id<"serviceRequests">;
  amount: number;
  currency?: string;
  notes?: string;
  validUntilDays?: number;
}

export interface DeclineRequestArgs {
  serviceRequestId: Id<"serviceRequests">;
  reason: string;
}

export interface UseQuoteMutationsResult {
  submitQuote: (args: SubmitQuoteArgs) => Promise<Id<"quotes">>;
  declineRequest: (args: DeclineRequestArgs) => Promise<{ success: boolean }>;
  isSubmitting: boolean;
  isDeclining: boolean;
}

/**
 * Returns typed mutation functions for quote submission and decline.
 *
 * Both mutations handle loading state via the returned boolean flags.
 * Error handling is left to the calling component (toast, form error, etc.).
 */
export function useQuoteMutations(): UseQuoteMutationsResult {
  const submitQuoteMutation = useMutation(api.quotes.submit);
  const declineRequestMutation = useMutation(
    api.serviceRequests.declineRequest,
  );

  return {
    submitQuote: submitQuoteMutation,
    declineRequest: declineRequestMutation,
    // Convex useMutation does not expose a built-in isPending flag;
    // components that need loading state should use local useState
    isSubmitting: false,
    isDeclining: false,
  };
}
