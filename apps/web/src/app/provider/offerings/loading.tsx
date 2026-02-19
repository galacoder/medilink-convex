/**
 * Loading state for the provider offerings page.
 *
 * WHY: Next.js App Router loading.tsx files provide an automatic skeleton
 * loader shown during server-side data fetching. Using animate-pulse divs
 * matches the project-wide skeleton pattern.
 */
export default function OfferingsLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-72 animate-pulse rounded" />
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-lg border p-4">
          <div className="space-y-2">
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
