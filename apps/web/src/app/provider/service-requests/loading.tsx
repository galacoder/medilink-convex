/**
 * Loading skeleton for the provider service requests page.
 *
 * WHY: Next.js App Router shows loading.tsx while the page and its data
 * are being fetched. This skeleton matches the service-requests page layout
 * (grid of cards) for smooth content transition.
 *
 * data-testid="provider-request-list-loading" for E2E assertion.
 */
import { Skeleton } from "@medilink/ui/skeleton";

export default function ProviderServiceRequestsLoading() {
  return (
    <div className="space-y-6" data-testid="provider-request-list-loading">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-28" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
