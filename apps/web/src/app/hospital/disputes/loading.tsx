import { Skeleton } from "@medilink/ui/skeleton";

/**
 * Skeleton loading state for disputes list page.
 *
 * WHY: Next.js App Router displays loading.tsx during navigation while the
 * page data loads. Skeleton rows match the dispute table layout so the
 * UI doesn't shift when content arrives.
 *
 * vi: "Tải trang danh sách khiếu nại" / en: "Disputes list loading"
 */
export default function DisputesListLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Status filter tabs skeleton */}
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <div className="bg-muted/50 grid grid-cols-[1fr_140px_200px_120px_40px] gap-4 px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_140px_200px_120px_40px] items-center gap-4 px-4 py-4"
            >
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
