/**
 * Loading skeleton for the service requests list page.
 *
 * WHY: Next.js Suspense automatically shows this loading.tsx while
 * the page data resolves. The skeleton matches the layout of the
 * real page to prevent layout shift (CLS) during page transitions.
 */
import { Skeleton } from "@medilink/ui/skeleton";

export default function ServiceRequestsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
