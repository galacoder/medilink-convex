"use client";

/**
 * Hook for service request mutation operations.
 *
 * WHY: Wraps useMutation for create, cancel, and quote accept/reject.
 * Centralizing mutation logic here means pages and components receive
 * typed callbacks without importing Convex API directly, simplifying
 * testing (mock the hook, not the Convex runtime).
 *
 * Error handling: mutations throw on failure so callers can display
 * contextual error messages (toast, inline error, etc.).
 */
import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@medilink/backend";

import type { CreateServiceRequestInput } from "../types";

interface RatingInput {
  rating: number;
  serviceQuality?: number;
  timeliness?: number;
  professionalism?: number;
  commentVi?: string;
}

export interface UseServiceRequestMutationsResult {
  createRequest: (input: CreateServiceRequestInput) => Promise<string>;
  cancelRequest: (id: string) => Promise<void>;
  acceptQuote: (quoteId: string) => Promise<void>;
  rejectQuote: (quoteId: string) => Promise<void>;
  rateService: (serviceRequestId: string, data: RatingInput) => Promise<void>;
  isCreating: boolean;
  isCancelling: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function useServiceRequestMutations(): UseServiceRequestMutationsResult {
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const createMutation = useMutation(api.serviceRequests.create);
  const cancelMutation = useMutation(api.serviceRequests.cancel);
  const acceptMutation = useMutation(api.quotes.accept);
  const rejectMutation = useMutation(api.quotes.reject);
  const rateMutation = useMutation(api.serviceRatings.create);

  async function createRequest(
    input: CreateServiceRequestInput,
  ): Promise<string> {
    setIsCreating(true);
    try {
      return (await createMutation({
        organizationId: input.organizationId,
        equipmentId: input.equipmentId,
        type: input.type,
        priority: input.priority,
        descriptionVi: input.descriptionVi,
        descriptionEn: input.descriptionEn,
        scheduledAt: input.scheduledAt,
      })) as string;
    } finally {
      setIsCreating(false);
    }
  }

  async function cancelRequest(id: string): Promise<void> {
    setIsCancelling(true);
    try {
      await cancelMutation({ id });
    } finally {
      setIsCancelling(false);
    }
  }

  async function acceptQuote(quoteId: string): Promise<void> {
    setIsAccepting(true);
    try {
      await acceptMutation({ id: quoteId });
    } finally {
      setIsAccepting(false);
    }
  }

  async function rejectQuote(quoteId: string): Promise<void> {
    setIsRejecting(true);
    try {
      await rejectMutation({ id: quoteId });
    } finally {
      setIsRejecting(false);
    }
  }

  async function rateService(
    serviceRequestId: string,
    data: RatingInput,
  ): Promise<void> {
    await rateMutation({
      serviceRequestId,
      rating: data.rating,
      serviceQuality: data.serviceQuality,
      timeliness: data.timeliness,
      professionalism: data.professionalism,
      commentVi: data.commentVi,
    });
  }

  return {
    createRequest,
    cancelRequest,
    acceptQuote,
    rejectQuote,
    rateService,
    isCreating,
    isCancelling,
    isAccepting,
    isRejecting,
  };
}
