"use client";

/**
 * Provider service execution detail page.
 *
 * WHY: When a provider staff member navigates to a specific service, they see
 * full details (equipment, hospital, quote) and can take execution actions:
 *   - Start service (accepted -> in_progress)
 *   - Update progress (add notes, flag issues)
 *   - Complete service (in_progress -> completed)
 *   - Submit completion report (structured data for M3-4 analytics)
 *
 * Mobile-optimized: large touch targets, clear status indicators.
 *
 * vi: "Chi tiết thực hiện dịch vụ" / en: "Service Execution Detail"
 */
import type { Id } from "convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";

import type {
  CompletionReportInput,
  ServiceRequestPriority,
  ServiceRequestStatus,
  ServiceRequestType,
} from "~/features/service-execution/types";
import { CompletionReportForm } from "~/features/service-execution/components/completion-report-form";
import { useServiceExecution } from "~/features/service-execution/hooks/use-service-execution";
import { serviceExecutionLabels } from "~/features/service-execution/labels";

/**
 * Shape returned by api.serviceRequests.getById enriched query.
 * WHY: The generated api.d.ts uses AnyApi so useQuery returns `any`.
 * Explicit interface gives TypeScript the structural info it needs.
 */
interface ServiceDetail {
  _id: Id<"serviceRequests">;
  _creationTime: number;
  organizationId: Id<"organizations">;
  equipmentId: Id<"equipment">;
  requestedBy: Id<"users">;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  descriptionVi: string;
  descriptionEn?: string;
  scheduledAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  assignedProviderId?: Id<"providers">;
  equipment: {
    nameVi: string;
    nameEn: string;
    status: string;
    condition: string;
  } | null;
  quotes: {
    _id: string;
    status: string;
    amount: number;
    currency: string;
  }[];
  rating: Record<string, unknown> | null;
  hospitalOrgName: string | null;
}

export default function ServiceExecutionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const serviceId = params.id as Id<"serviceRequests">;

  const service = useQuery(api.serviceRequests.getById, {
    id: serviceId,
  }) as ServiceDetail | null | undefined;
  const {
    startService,
    completeService,
    submitCompletionReport,
    isSubmitting,
    error,
  } = useServiceExecution();

  // Loading state
  if (service === undefined) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-64 w-full animate-pulse rounded" />
      </div>
    );
  }

  // Error state (null = query threw)
  if (service === null) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          {serviceExecutionLabels.actions.back.vi}
        </Button>
        <p className="text-destructive">
          Không tìm thấy yêu cầu dịch vụ hoặc bạn không có quyền truy cập.
          {/* Service request not found or access denied. */}
        </p>
      </div>
    );
  }

  const isAccepted = service.status === "accepted";
  const isInProgress = service.status === "in_progress";
  const isCompleted = service.status === "completed";

  const statusKey =
    service.status as keyof typeof serviceExecutionLabels.status;
  const statusLabel: { vi: string; en: string } =
    statusKey in serviceExecutionLabels.status
      ? serviceExecutionLabels.status[statusKey]
      : { vi: service.status, en: service.status };

  const typeLabel =
    serviceExecutionLabels.requestType[
      service.type as keyof typeof serviceExecutionLabels.requestType
    ];

  const priorityLabel =
    serviceExecutionLabels.priority[
      service.priority as keyof typeof serviceExecutionLabels.priority
    ];

  async function handleStartService() {
    await startService({ id: serviceId });
  }

  async function handleCompleteService() {
    await completeService({ id: serviceId });
  }

  async function handleSubmitReport(data: CompletionReportInput) {
    await submitCompletionReport({
      id: serviceId,
      workDescriptionVi: data.workDescriptionVi,
      workDescriptionEn: data.workDescriptionEn,
      partsReplaced: data.partsReplaced,
      nextMaintenanceRecommendation: data.nextMaintenanceRecommendation,
      actualHours: data.actualHours,
      photoUrls: data.photoUrls,
      actualCompletionTime: data.actualCompletionTime,
    });
  }

  return (
    <div className="space-y-6" data-testid="service-detail-page">
      {/* Back button */}
      <Button
        variant="outline"
        onClick={() => router.push("/provider/services")}
      >
        {serviceExecutionLabels.actions.back.vi}
      </Button>

      {/* Service detail card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>
              {serviceExecutionLabels.page.serviceDetail.vi}
            </CardTitle>
            <div className="flex gap-2">
              <Badge>{statusLabel.vi}</Badge>
              <Badge variant="outline">{priorityLabel.vi}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment info */}
          <div>
            <p className="text-muted-foreground text-sm">
              {serviceExecutionLabels.info.equipment.vi}
            </p>
            <p className="font-medium">
              {service.equipment?.nameVi ?? service.equipment?.nameEn ?? "—"}
            </p>
          </div>

          {/* Hospital */}
          <div>
            <p className="text-muted-foreground text-sm">
              {serviceExecutionLabels.info.hospital.vi}
            </p>
            <p className="font-medium">{service.hospitalOrgName ?? "—"}</p>
          </div>

          {/* Service type */}
          <div>
            <p className="text-muted-foreground text-sm">
              {serviceExecutionLabels.info.type.vi}
            </p>
            <p className="font-medium">{typeLabel.vi}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground text-sm">
              {serviceExecutionLabels.info.description.vi}
            </p>
            <p>{service.descriptionVi}</p>
          </div>

          {/* Accepted quote amount */}
          {service.quotes.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm">
                {serviceExecutionLabels.info.quoteAmount.vi}
              </p>
              {service.quotes
                .filter((q) => q.status === "accepted")
                .map((q) => (
                  <p key={q._id} className="font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: q.currency || "VND",
                      maximumFractionDigits: 0,
                    }).format(q.amount)}
                  </p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {isAccepted && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartService}
            disabled={isSubmitting}
            data-testid="start-service-btn"
          >
            {isSubmitting
              ? "Đang xử lý..." /* Processing... */
              : serviceExecutionLabels.actions.startService.vi}
          </Button>
        )}

        {isInProgress && (
          <>
            <Button
              className="w-full"
              size="lg"
              variant="default"
              onClick={handleCompleteService}
              disabled={isSubmitting}
              data-testid="complete-service-btn"
            >
              {isSubmitting
                ? "Đang xử lý..." /* Processing... */
                : serviceExecutionLabels.actions.completeService.vi}
            </Button>
          </>
        )}
      </div>

      {/* Completion report form (visible when in_progress or completed) */}
      {(isInProgress || isCompleted) && (
        <CompletionReportForm
          serviceRequestId={serviceId}
          onSubmit={handleSubmitReport}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
