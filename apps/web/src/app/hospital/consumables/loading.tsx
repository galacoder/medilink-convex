/**
 * Loading skeleton for the consumables list page.
 * Matches the table layout for smooth Suspense transition.
 *
 * vi: "Đang tải danh sách vật tư tiêu hao" / en: "Loading consumables list"
 */
export default function ConsumablesLoading() {
  return (
    <div className="space-y-6">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 animate-pulse rounded" />
      </div>

      {/* Filter controls skeleton */}
      <div className="flex gap-3">
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/50 px-4 py-3">
          <div className="bg-muted h-5 w-full animate-pulse rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-t px-4 py-3">
            <div className="bg-muted h-12 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
