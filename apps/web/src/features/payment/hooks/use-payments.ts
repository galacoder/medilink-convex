"use client";

import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { Payment, PaymentStatus } from "../types";

// Cast via (api as any) until `npx convex dev` regenerates types.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const paymentApi = (api as any).payment;
type QueryRef = FunctionReference<"query">;
const listFn: QueryRef = paymentApi.list;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook wrapping Convex payment list query (org-scoped).
 *
 * WHY: Centralizes query logic and status filtering for the payment list page.
 * Real-time subscriptions update the list automatically when payments change.
 *
 * vi: "Hook danh sach thanh toan" / en: "Payments list hook"
 */
export function usePayments(status?: PaymentStatus) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payments = useQuery(listFn, status ? { status } : {});

  return {
    payments: (payments ?? []) as Payment[],
    isLoading: payments === undefined,
  };
}
