/**
 * Loading state for the provider active services page.
 *
 * WHY: Next.js App Router loading.tsx files provide an automatic skeleton
 * loader shown during client-side navigation. Using animate-pulse divs
 * matches the project-wide skeleton pattern established in offerings/loading.
 *
 * vi: "Đang tải danh sách dịch vụ" / en: "Loading active services"
 */
export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="bg-muted h-8 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-80 animate-pulse rounded" />
      </div>

      {/* Service card skeletons */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-lg border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-muted h-6 w-40 animate-pulse rounded" />
              <div className="bg-muted h-5 w-20 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-10 w-full animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
