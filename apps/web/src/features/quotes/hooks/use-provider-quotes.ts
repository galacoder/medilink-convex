"use client";

/**
 * Hook for listing quotes submitted by the authenticated provider organization.
 *
 * WHY: Wraps api.quotes.listByProvider with optional status filtering and
 * returns typed ProviderQuote[] including the joined service request summary.
 * Real-time via Convex useQuery — updates when hospitals accept/reject quotes.
 */
import { api } from "@medilink/db/api";
import { useQuery } from "convex/react";

import type { ProviderQuote, QuoteDashboardStats, QuoteStatus } from "../types";

export interface UseProviderQuotesOptions {
  status?: QuoteStatus | "all";
}

export interface UseProviderQuotesResult {
  quotes: ProviderQuote[];
  isLoading: boolean;
  // WHY: Convex useQuery returns null when the query handler throws a ConvexError.
  // This is distinct from undefined (loading). hasError=true means the server
  // denied access or encountered an error — show error UI instead of empty list.
  hasError: boolean;
  stats: QuoteDashboardStats;
}

/**
 * Returns quotes submitted by the current provider org.
 *
 * @param status - Filter by quote status. Pass "all" or omit for all statuses.
 */
export function useProviderQuotes(
  status?: QuoteStatus | "all",
): UseProviderQuotesResult {
  const convexStatus = status && status !== "all" ? status : undefined;

  // Convex useQuery returns:
  //   undefined = loading (not yet received response)
  //   null      = query threw an error (ConvexError, permission denied, etc.)
  //   T[]       = success
  const result = useQuery(api.quotes.listByProvider, {
    ...(convexStatus ? { status: convexStatus } : {}),
  }) as ProviderQuote[] | null | undefined;

  const isLoading = result === undefined;
  const hasError = result === null;
  const resolvedQuotes = isLoading || hasError ? [] : result;

  // Calculate dashboard stats from all quotes (use unfiltered when possible)
  // WHY: Stats should always reflect total history, not just the filtered view
  const allResult = useQuery(api.quotes.listByProvider, {}) as
    | ProviderQuote[]
    | null
    | undefined;
  const statsQuotes = allResult ?? [];

  const pendingCount = statsQuotes.filter((q) => q.status === "pending").length;
  const acceptedCount = statsQuotes.filter(
    (q) => q.status === "accepted",
  ).length;
  const rejectedCount = statsQuotes.filter(
    (q) => q.status === "rejected",
  ).length;
  const totalCount = statsQuotes.length;

  // Win rate = accepted / (accepted + rejected) * 100
  // Returns -1 when no decided quotes yet (avoid divide-by-zero)
  const decidedCount = acceptedCount + rejectedCount;
  const winRate =
    decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : -1;

  return {
    quotes: resolvedQuotes,
    isLoading,
    hasError,
    stats: {
      pendingCount,
      acceptedCount,
      rejectedCount,
      totalCount,
      winRate,
    },
  };
}
