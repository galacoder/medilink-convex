"use client";

import type { FunctionReference } from "convex/server";
import { api } from "@medilink/db/api";
import { useMutation, useQuery } from "convex/react";

import type { SupportTicketWithDetails } from "../types";

// Cast via (api as any) until `npx convex dev` regenerates types.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const getByIdFn: QueryRef = supportApi.getById;
const addMessageFn: MutationRef = supportApi.addMessage;
const updateStatusFn: MutationRef = supportApi.updateStatus;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Composite hook for support ticket detail page.
 *
 * WHY: The detail page needs the ticket data with messages, plus mutation
 * functions for adding replies and updating status. Composing them here
 * keeps the page component clean and testable.
 *
 * vi: "Hook chi tiet phieu ho tro" / en: "Support ticket detail hook"
 */
export function useSupportDetail(ticketId: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ticket = useQuery(getByIdFn, ticketId ? { ticketId } : "skip");
  const addMessage = useMutation(addMessageFn);
  const updateStatus = useMutation(updateStatusFn);

  return {
    ticket: (ticket ?? null) as SupportTicketWithDetails | null,
    isLoading: ticket === undefined,
    addMessage,
    updateStatus,
  };
}
