"use client";

/**
 * Provider quotes list page — manage all submitted quotes.
 *
 * WHY: Providers need a central dashboard to track the status of all their
 * submitted quotes, understand their win rate, and quickly see which quotes
 * are pending hospital decisions. QuoteDashboardStats gives the high-level
 * view; the list below gives granular per-quote status.
 *
 * Real-time via Convex useQuery — updates when hospitals accept/reject quotes.
 *
 * vi: "Báo giá của tôi" / en: "My Quotes"
 */
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@medilink/ui/tabs";

import type { QuoteStatus } from "~/features/quotes/types";
import { QuoteDashboardStats } from "~/features/quotes/components/quote-dashboard-stats";
import { QuoteStatusBadge } from "~/features/quotes/components/quote-status-badge";
import { useProviderQuotes } from "~/features/quotes/hooks/use-provider-quotes";
import { quoteLabels } from "~/features/quotes/labels";

type StatusFilter = QuoteStatus | "all";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: quoteLabels.status.pending.vi },
  { value: "accepted", label: quoteLabels.status.accepted.vi },
  { value: "rejected", label: quoteLabels.status.rejected.vi },
];

/** Formats a number as Vietnamese Dong */
function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/** Formats epoch ms as short Vietnamese date */
function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(epochMs));
}

export default function ProviderQuotesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { quotes, isLoading, hasError, stats } =
    useProviderQuotes(statusFilter);

  return (
    <div className="space-y-6" data-testid="provider-quotes-list">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          {quoteLabels.page.myQuotes.vi} {/* {quoteLabels.page.myQuotes.en} */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi báo giá và tỷ lệ thắng của bạn{" "}
          {/* Track your quotes and win rate */}
        </p>
      </div>

      {/* Dashboard stats */}
      <QuoteDashboardStats stats={stats} />

      {/* Status filter tabs + quote list */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {hasError ? (
              <div
                className="text-destructive flex min-h-[150px] items-center justify-center rounded-lg border border-dashed"
                data-testid="provider-quotes-list-error"
              >
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Không thể tải danh sách báo giá. Vui lòng thử lại.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Unable to load quotes. Please try again.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-muted-foreground flex min-h-[150px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {quoteLabels.emptyState.noQuotes.vi}
                  </p>
                  <p className="text-xs">
                    {quoteLabels.emptyState.noQuotesDescription.vi}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <Card key={quote._id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base">
                            {quote.serviceRequest?.equipmentNameVi ??
                              quote.serviceRequest?.equipmentNameEn ??
                              "—"}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {quote.serviceRequest?.hospitalOrgName ?? "—"}
                          </p>
                        </div>
                        <QuoteStatusBadge
                          status={
                            quote.status as
                              | "pending"
                              | "accepted"
                              | "rejected"
                              | "expired"
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">
                          {formatVND(quote.amount)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(quote.createdAt)}
                        </span>
                      </div>
                      {quote.serviceRequest?.descriptionVi && (
                        <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          {quote.serviceRequest.descriptionVi}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
