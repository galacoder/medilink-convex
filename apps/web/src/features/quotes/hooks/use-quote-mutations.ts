"use client";

/**
 * Hook wrapping Convex mutations for provider quote actions.
 *
 * WHY: Centralizes all mutation calls (submit quote, decline request, update quote)
 * with typed callbacks and real loading state. Components call these hooks instead
 * of calling useMutation() directly, keeping mutation logic out of UI components.
 */
import { useState } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";

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

export interface UpdateQuoteArgs {
  quoteId: Id<"quotes">;
  amount?: number;
  notes?: string;
  validUntilDays?: number;
  estimatedDurationDays?: number;
  availableStartDate?: number;
}

export interface DeclineRequestArgs {
  serviceRequestId: Id<"serviceRequests">;
  reason: string;
}

export interface UseQuoteMutationsResult {
  submitQuote: (args: SubmitQuoteArgs) => Promise<Id<"quotes">>;
  updateQuote: (args: UpdateQuoteArgs) => Promise<Id<"quotes">>;
  declineRequest: (args: DeclineRequestArgs) => Promise<{ success: boolean }>;
  isSubmitting: boolean;
  isUpdating: boolean;
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
  // WHY anyApi: convex/_generated/api.ts doesn't include `quotes.update` yet
  // because the generated types are created by `npx convex dev` at runtime.
  // Using anyApi avoids type errors in CI while still providing runtime safety
  // through Convex's schema validation. The mutation name matches convex/quotes.ts `update` export.
  const updateQuoteMutation = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    anyApi.quotes!.update as Parameters<typeof useMutation>[0],
  );
  const declineRequestMutation = useMutation(
    api.serviceRequests.declineRequest,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  async function submitQuote(args: SubmitQuoteArgs): Promise<Id<"quotes">> {
    setIsSubmitting(true);
    try {
      return (await submitQuoteMutation(args)) as Id<"quotes">;
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Updates an existing pending quote.
   *
   * WHY: Providers sometimes need to revise quote details before the hospital
   * accepts or rejects. Only pending quotes can be updated.
   *
   * vi: "Cập nhật báo giá" / en: "Update quote"
   */
  async function updateQuote(args: UpdateQuoteArgs): Promise<Id<"quotes">> {
    setIsUpdating(true);
    try {
      return (await updateQuoteMutation(args)) as Id<"quotes">;
    } finally {
      setIsUpdating(false);
    }
  }

  async function declineRequest(
    args: DeclineRequestArgs,
  ): Promise<{ success: boolean }> {
    setIsDeclining(true);
    try {
      return (await declineRequestMutation(args)) as { success: boolean };
    } finally {
      setIsDeclining(false);
    }
  }

  return {
    submitQuote,
    updateQuote,
    declineRequest,
    isSubmitting,
    isUpdating,
    isDeclining,
  };
}
