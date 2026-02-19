import { Skeleton } from "@medilink/ui/skeleton";

/**
 * Skeleton loading state for dispute detail page.
 *
 * WHY: Next.js App Router displays loading.tsx during navigation while the
 * page data loads. Skeleton matches the 2-column detail layout so the
 * UI doesn't shift when content arrives.
 *
 * vi: "Tải trang chi tiết khiếu nại" / en: "Dispute detail loading"
 */
export default function DisputeDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* 2-column grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Dispute info card */}
          <div className="rounded-lg border p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Message thread skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <div className="min-h-[200px] rounded-md border p-4 space-y-3">
              <div className="flex justify-start">
                <Skeleton className="h-14 w-48 rounded-xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-40 rounded-xl" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-12 w-56 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <div className="border-t pt-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
