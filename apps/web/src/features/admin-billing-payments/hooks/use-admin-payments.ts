"use client";

/**
 * Hook for the admin payment list with search, filter, and status filtering.
 *
 * WHY: Centralizes query logic so payment list page doesn't need to know
 * about Convex internals. Real-time subscriptions via useQuery keep the
 * list updated automatically.
 *
 * vi: "Hook danh sach thanh toan quan tri" / en: "Admin payment list hook"
 */
import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type {
  PaymentFilters,
  PaymentListItem,
  PaymentListResult,
} from "../types";

// Cast the api reference to avoid noUncheckedIndexedAccess issues with AnyApi stub.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const billingPaymentsApi = (api as any).billing?.payments;
type QueryRef = FunctionReference<"query">;
const listPaymentsFn: QueryRef = billingPaymentsApi?.listPayments;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const EMPTY_PAYMENTS: PaymentListItem[] = [];

/**
 * Hook wrapping the admin listPayments Convex query.
 * Provides real-time, filtered payment list.
 *
 * vi: "Hook danh sach thanh toan cho quan tri vien" / en: "Admin payment list hook"
 */
export function useAdminPayments(filters?: PaymentFilters) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(listPaymentsFn, {
    statusFilter: filters?.statusFilter ?? undefined,
    organizationId: filters?.organizationId ?? undefined,
    searchQuery: filters?.searchQuery ?? undefined,
  });

  const typedResult = result as PaymentListResult | undefined;

  return {
    payments: typedResult?.payments ?? EMPTY_PAYMENTS,
    total: typedResult?.total ?? 0,
    isLoading: result === undefined,
  };
}
