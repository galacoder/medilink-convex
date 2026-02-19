"use client";

/**
 * Hook for listing quotes submitted by the authenticated provider organization.
 *
 * WHY: Wraps api.quotes.listByProvider with optional status filtering and
 * returns typed ProviderQuote[] including the joined service request summary.
 * Real-time via Convex useQuery — updates when hospitals accept/reject quotes.
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import type { ProviderQuote, QuoteStatus, QuoteDashboardStats } from "../types";

export interface UseProviderQuotesOptions {
  status?: QuoteStatus | "all";
}

export interface UseProviderQuotesResult {
  quotes: ProviderQuote[];
  isLoading: boolean;
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
  const convexStatus =
    status && status !== "all" ? status : undefined;

  const quotes = useQuery(api.quotes.listByProvider, {
    ...(convexStatus ? { status: convexStatus } : {}),
  }) as ProviderQuote[] | undefined;

  const resolvedQuotes = quotes ?? [];

  // Calculate dashboard stats from all quotes (use unfiltered when possible)
  // WHY: Stats should always reflect total history, not just the filtered view
  const allQuotes = useQuery(api.quotes.listByProvider, {}) as
    | ProviderQuote[]
    | undefined;
  const statsQuotes = allQuotes ?? [];

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
    isLoading: quotes === undefined,
    stats: {
      pendingCount,
      acceptedCount,
      rejectedCount,
      totalCount,
      winRate,
    },
  };
}
