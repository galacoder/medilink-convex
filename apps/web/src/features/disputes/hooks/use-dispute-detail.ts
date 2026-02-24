"use client";

import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";

import type { DisputeMessageWithAuthor, DisputeWithDetails } from "../types";

// Cast the api reference to avoid noUncheckedIndexedAccess issues with AnyApi stub.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const disputesApi = api.disputes as any;
type QueryRef = FunctionReference<"query">;
const getByIdFn: QueryRef = disputesApi.getById;
const getMessagesFn: QueryRef = disputesApi.getMessages;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Composite hook for dispute detail page.
 *
 * WHY: The detail page needs two reactive data sources (dispute + messages)
 * that update in real-time via Convex subscriptions. Composing them here
 * keeps the page component clean and testable.
 *
 * vi: "Hook chi tiết tranh chấp" / en: "Dispute detail hook"
 */
export function useDisputeDetail(id: Id<"disputes"> | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dispute = useQuery(getByIdFn, id ? { id } : "skip");

  return {
    dispute: (dispute ?? null) as DisputeWithDetails | null,
    isLoading: dispute === undefined,
  };
}

/**
 * Hook for the dispute message thread.
 * Provides real-time updates via Convex subscription.
 *
 * vi: "Hook tin nhắn tranh chấp" / en: "Dispute messages hook"
 */
export function useDisputeMessages(disputeId: Id<"disputes"> | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const messages = useQuery(getMessagesFn, disputeId ? { disputeId } : "skip");

  return {
    messages: (messages ?? []) as DisputeMessageWithAuthor[],
    isLoading: messages === undefined,
  };
}
