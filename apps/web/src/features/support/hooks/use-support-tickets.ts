"use client";

import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SupportTicket, SupportTicketStatus } from "../types";

// Cast the api reference to avoid TS errors until `npx convex dev` regenerates
// the generated API types to include the new support module.
// WHY: support.ts was added in Wave 3 but _generated/api.d.ts is only updated
// by running `npx convex dev`. The runtime api object will have these functions.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
type QueryRef = FunctionReference<"query">;
const listByOrgFn: QueryRef = supportApi.listByOrg;
const listByUserFn: QueryRef = supportApi.listByUser;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook wrapping Convex support ticket list query (org-scoped).
 *
 * WHY: Centralizes filter state and query logic so the list page
 * and other consumers don't need to know about Convex internals.
 * Real-time subscriptions update the list automatically when tickets change.
 *
 * vi: "Hook danh sach phieu ho tro" / en: "Support tickets list hook"
 */
export function useSupportTickets(status?: SupportTicketStatus) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tickets = useQuery(listByOrgFn, status ? { status } : {});

  return {
    tickets: (tickets ?? []) as SupportTicket[],
    isLoading: tickets === undefined,
  };
}

/**
 * Hook wrapping Convex support ticket list query (user-scoped).
 *
 * WHY: Returns the authenticated user's personal ticket list.
 * Used for "My Tickets" views.
 *
 * vi: "Hook danh sach phieu ho tro cua toi" / en: "My support tickets hook"
 */
export function useMyTickets() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tickets = useQuery(listByUserFn, {});

  return {
    tickets: (tickets ?? []) as SupportTicket[],
    isLoading: tickets === undefined,
  };
}
