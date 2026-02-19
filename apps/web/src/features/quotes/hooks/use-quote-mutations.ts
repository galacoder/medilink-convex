"use client";

/**
 * Hook wrapping Convex mutations for provider quote actions.
 *
 * WHY: Centralizes all mutation calls (submit quote, decline request) with
 * typed callbacks and real loading state. Components call these hooks instead
 * of calling useMutation() directly, keeping mutation logic out of UI components.
 */
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export interface SubmitQuoteArgs {
  serviceRequestId: Id<"serviceRequests">;
  amount: number;
  currency?: string;
  notes?: string;
  validUntilDays?: number;
  // vi: "Số ngày ước tính" / en: "Estimated duration in days"
  estimatedDurationDays?: number;
  // vi: "Ngày bắt đầu sớm nhất (epoch ms)" / en: "Available start date (epoch ms)"
  availableStartDate?: number;
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
 * Loading state is tracked via useState because Convex useMutation does not
 * expose a built-in isPending flag. Error handling is left to the calling
 * component (toast, form error, etc.).
 */
export function useQuoteMutations(): UseQuoteMutationsResult {
  const submitQuoteMutation = useMutation(api.quotes.submit);
  const declineRequestMutation = useMutation(
    api.serviceRequests.declineRequest,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  async function submitQuote(args: SubmitQuoteArgs): Promise<Id<"quotes">> {
    setIsSubmitting(true);
    try {
      return await submitQuoteMutation(args);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function declineRequest(
    args: DeclineRequestArgs,
  ): Promise<{ success: boolean }> {
    setIsDeclining(true);
    try {
      return await declineRequestMutation(args);
    } finally {
      setIsDeclining(false);
    }
  }

  return {
    submitQuote,
    declineRequest,
    isSubmitting,
    isDeclining,
  };
}
