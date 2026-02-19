/**
 * Loading skeleton for the provider analytics dashboard.
 *
 * WHY: Analytics charts take time to load because they aggregate data across
 * multiple tables. Showing a skeleton prevents layout shift and gives users
 * visual feedback that the page is loading.
 *
 * vi: "Skeleton tải trang phân tích" / en: "Analytics page loading skeleton"
 */
import { Skeleton } from "@medilink/ui/skeleton";

export default function ProviderAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Date range filter skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* KPI cards row skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border p-6 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Revenue chart skeleton */}
      <div className="rounded-xl border p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Bottom section skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-3 rounded-xl border p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
