import { Skeleton } from "@medilink/ui/skeleton";

/**
 * Skeleton loading state for equipment list page.
 *
 * WHY: Next.js App Router displays loading.tsx during navigation while the
 * page data loads. Skeleton rows match the equipment table layout so the
 * UI doesn't shift when content arrives.
 */
export default function EquipmentListLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-52" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <div className="bg-muted/50 px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="hidden h-4 w-20 md:block" />
              <Skeleton className="hidden h-4 w-24 lg:block" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
