"use client";

/**
 * Provider active services list page — mobile-optimized.
 *
 * WHY: Provider staff use this page on-site from phone/tablet to view their
 * assigned services (accepted = scheduled, in_progress = on-site). Services
 * are sorted by scheduledAt (earliest first) so the next job is always at top.
 *
 * Two sections:
 *   1. "Đang thực hiện tại chỗ" (On-Site) — in_progress services
 *   2. "Dịch vụ đã lên lịch" (Scheduled) — accepted services waiting to start
 *
 * vi: "Danh sách dịch vụ đang hoạt động" / en: "Active Services List"
 */
import { useRouter } from "next/navigation";

import { ActiveServiceCard } from "~/features/service-execution/components/active-service-card";
import { useActiveServices } from "~/features/service-execution/hooks/use-active-services";
import { useServiceExecution } from "~/features/service-execution/hooks/use-service-execution";
import { serviceExecutionLabels } from "~/features/service-execution/labels";

export default function ProviderServicesPage() {
  const router = useRouter();
  const { scheduledServices, onSiteServices, isLoading, hasError, totalCount } =
    useActiveServices();
  const { startService } = useServiceExecution();

  function handleViewDetail(id: string) {
    router.push(`/provider/services/${id}`);
  }

  async function handleStartService(id: string) {
    await startService({ id });
  }

  function handleUpdateProgress(id: string) {
    router.push(`/provider/services/${id}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-32 w-full animate-pulse rounded" />
        <div className="bg-muted h-32 w-full animate-pulse rounded" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          {serviceExecutionLabels.page.activeServices.vi}
        </h1>
        <p className="text-destructive">
          Không thể tải danh sách dịch vụ. Vui lòng thử lại.
          {/* Unable to load services. Please try again. */}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="active-services-page">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          {serviceExecutionLabels.page.activeServices.vi}
          {/* {serviceExecutionLabels.page.activeServices.en} */}
        </h1>
        <p className="text-muted-foreground mt-1">
          {totalCount > 0
            ? `${totalCount} dịch vụ đang hoạt động`
            : serviceExecutionLabels.emptyState.noActiveServicesDescription.vi}
          {/* Active service count or empty state */}
        </p>
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-lg">
            {serviceExecutionLabels.emptyState.noActiveServices.vi}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {serviceExecutionLabels.emptyState.noActiveServicesDescription.vi}
          </p>
        </div>
      )}

      {/* On-site services (in_progress) — shown first for urgency */}
      {onSiteServices.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">
            {serviceExecutionLabels.sections.onSite.vi}
            {/* {serviceExecutionLabels.sections.onSite.en} */}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {onSiteServices.map((service) => (
              <ActiveServiceCard
                key={service._id}
                service={service}
                onStartService={handleStartService}
                onViewDetail={handleViewDetail}
                onUpdateProgress={handleUpdateProgress}
              />
            ))}
          </div>
        </section>
      )}

      {/* Scheduled services (accepted) — upcoming work */}
      {scheduledServices.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">
            {serviceExecutionLabels.sections.scheduled.vi}
            {/* {serviceExecutionLabels.sections.scheduled.en} */}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {scheduledServices.map((service) => (
              <ActiveServiceCard
                key={service._id}
                service={service}
                onStartService={handleStartService}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
