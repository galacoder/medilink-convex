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

// The billing.payments namespace is dynamically registered at runtime
type QueryRef = FunctionReference<"query">;

interface BillingPaymentsQueryApi {
  listPayments: QueryRef;
}

const listPaymentsFn: QueryRef = (
  api as unknown as { billing: { payments: BillingPaymentsQueryApi } }
).billing.payments.listPayments;

const EMPTY_PAYMENTS: PaymentListItem[] = [];

/**
 * Hook wrapping the admin listPayments Convex query.
 * Provides real-time, filtered payment list.
 *
 * vi: "Hook danh sach thanh toan cho quan tri vien" / en: "Admin payment list hook"
 */
export function useAdminPayments(filters?: PaymentFilters) {
  const result = useQuery(listPaymentsFn, {
    statusFilter: filters?.statusFilter ?? undefined,
    organizationId: filters?.organizationId ?? undefined,
    searchQuery: filters?.searchQuery ?? undefined,
  }) as PaymentListResult | undefined;

  return {
    payments: result?.payments ?? EMPTY_PAYMENTS,
    total: result?.total ?? 0,
    isLoading: result === undefined,
  };
}
