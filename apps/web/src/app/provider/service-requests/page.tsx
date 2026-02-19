"use client";

/**
 * Provider service requests page — incoming requests from hospitals.
 *
 * WHY: Providers need to see all pending/quoted service requests from
 * hospitals in their coverage area so they can decide which to quote on
 * and which to decline. This replaces the scaffold with real Convex data.
 *
 * Preserves data-testid="provider-request-list" for E2E test compatibility.
 *
 * vi: "Yêu cầu dịch vụ từ bệnh viện" / en: "Hospital Service Requests"
 */
import { useState } from "react";

import { Skeleton } from "@medilink/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@medilink/ui/tabs";

import { useIncomingRequests } from "~/features/quotes/hooks/use-incoming-requests";
import { IncomingRequestCard } from "~/features/quotes/components/incoming-request-card";
import { quoteLabels } from "~/features/quotes/labels";
import type { ServiceRequestStatus } from "~/features/quotes/types";

type StatusFilter = ServiceRequestStatus | "all";

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: quoteLabels.requestStatus.pending.vi },
  { value: "quoted", label: quoteLabels.requestStatus.quoted.vi },
  { value: "accepted", label: quoteLabels.requestStatus.accepted.vi },
];

export default function ProviderServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { requests, isLoading, hasError } = useIncomingRequests(statusFilter);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          {quoteLabels.page.incomingRequests.vi}{" "}
          {/* {quoteLabels.page.incomingRequests.en} */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Yêu cầu dịch vụ từ các bệnh viện{" "}
          {/* Service requests from hospitals */}
        </p>
      </div>

      {/* Status filter tabs */}
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
          <TabsContent key={tab.value} value={tab.value}>
            {hasError ? (
              <div
                className="text-destructive flex min-h-[200px] items-center justify-center rounded-lg border border-dashed"
                data-testid="provider-request-list-error"
              >
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Không thể tải danh sách yêu cầu. Vui lòng thử lại.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unable to load service requests. Please try again.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="provider-request-list"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-lg" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div
                className="text-muted-foreground flex min-h-[200px] items-center justify-center rounded-lg border border-dashed"
                data-testid="provider-request-list"
              >
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {quoteLabels.emptyState.noIncomingRequests.vi}
                  </p>
                  <p className="text-xs">
                    {quoteLabels.emptyState.noIncomingRequestsDescription.vi}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="provider-request-list"
              >
                {requests.map((request) => (
                  <IncomingRequestCard key={request._id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
