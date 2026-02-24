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

import type { Id } from "@medilink/backend";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const acceptMutation = useMutation((api.quotes as any).accept);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const rejectMutation = useMutation((api.quotes as any).reject);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const rateMutation = useMutation((api as any).serviceRatings.create);

  async function createRequest(
    input: CreateServiceRequestInput,
  ): Promise<string> {
    setIsCreating(true);
    try {
      return (await createMutation({
        organizationId: input.organizationId as Id<"organizations">,
        equipmentId: input.equipmentId as Id<"equipment">,
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
      await cancelMutation({ id: id as Id<"serviceRequests"> });
    } finally {
      setIsCancelling(false);
    }
  }

  async function acceptQuote(quoteId: string): Promise<void> {
    setIsAccepting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await acceptMutation({ id: quoteId as Id<"quotes"> });
    } finally {
      setIsAccepting(false);
    }
  }

  async function rejectQuote(quoteId: string): Promise<void> {
    setIsRejecting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await rejectMutation({ id: quoteId as Id<"quotes"> });
    } finally {
      setIsRejecting(false);
    }
  }

  async function rateService(
    serviceRequestId: string,
    data: RatingInput,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await rateMutation({
      serviceRequestId: serviceRequestId as Id<"serviceRequests">,
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
