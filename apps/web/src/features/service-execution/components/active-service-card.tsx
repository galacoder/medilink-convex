"use client";

/**
 * ActiveServiceCard component — displays an accepted or in_progress service request.
 *
 * WHY: Provider staff use this on mobile devices on-site. Large touch targets,
 * clear status indicators, and quick-action buttons make it easy to start service
 * or update progress without needing to navigate to the detail page.
 *
 * Mobile-optimized: uses large button sizes, clear visual hierarchy, and
 * high-contrast status badges for outdoor readability.
 */
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type {
  ActiveService,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "../types";
import { serviceExecutionLabels } from "../labels";

interface ActiveServiceCardProps {
  service: ActiveService;
  onStartService: (id: string) => void;
  onViewDetail: (id: string) => void;
  onUpdateProgress?: (id: string) => void;
}

const priorityVariantMap: Record<
  ServiceRequestPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
};

const statusVariantMap: Record<
  Extract<ServiceRequestStatus, "accepted" | "in_progress">,
  "default" | "secondary" | "destructive" | "outline"
> = {
  accepted: "outline",
  in_progress: "default",
};

/** Formats epoch ms as short Vietnamese date + time */
function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(epochMs));
}

/** Formats Vietnamese Dong amount */
function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ActiveServiceCard({
  service,
  onStartService,
  onViewDetail,
  onUpdateProgress,
}: ActiveServiceCardProps) {
  const equipmentName =
    service.equipmentNameVi ?? service.equipmentNameEn ?? "—";
  const typeLabel = serviceExecutionLabels.requestType[service.type];
  const priorityLabel = serviceExecutionLabels.priority[service.priority];
  const priorityVariant = priorityVariantMap[service.priority];

  const isInProgress = service.status === "in_progress";
  const isAccepted = service.status === "accepted";

  const statusKey = service.status as keyof typeof serviceExecutionLabels.status;
  const statusLabel: { vi: string; en: string } =
    statusKey in serviceExecutionLabels.status
      ? serviceExecutionLabels.status[statusKey]
      : { vi: service.status, en: service.status };

  const statusVariant =
    service.status === "in_progress" || service.status === "accepted"
      ? statusVariantMap[service.status]
      : "outline";

  return (
    <Card data-testid="active-service-card" className="touch-manipulation">
      {/* Header: equipment + hospital + priority badge */}
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{equipmentName}</CardTitle>
          <p className="text-muted-foreground mt-0.5 truncate text-sm">
            {service.hospitalOrgName ?? "—"}
          </p>
          {service.equipmentLocation && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {serviceExecutionLabels.info.location.vi}:{" "}
              {service.equipmentLocation}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={priorityVariant}>
            {priorityLabel.vi} {/* {priorityLabel.en} */}
          </Badge>
          <Badge variant={statusVariant}>
            {statusLabel.vi} {/* {statusLabel.en} */}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Service type */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {serviceExecutionLabels.info.type.vi}:
          </span>
          <span>{typeLabel.vi}</span>
        </div>

        {/* Description preview */}
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {service.descriptionVi}
        </p>

        {/* Scheduled date */}
        {service.scheduledAt && (
          <p className="text-muted-foreground text-xs">
            {serviceExecutionLabels.info.scheduledAt.vi}:{" "}
            {formatDate(service.scheduledAt)}
          </p>
        )}

        {/* Contract value */}
        {service.acceptedQuoteAmount != null && (
          <p className="text-xs font-medium">
            {serviceExecutionLabels.info.quoteAmount.vi}:{" "}
            {formatVND(service.acceptedQuoteAmount)}
          </p>
        )}
      </CardContent>

      {/* Action buttons — large touch targets for mobile */}
      <CardFooter className="flex flex-col gap-2">
        {isAccepted && (
          <Button
            className="w-full"
            size="lg"
            onClick={() => onStartService(service._id)}
            data-testid="start-service-btn"
          >
            {serviceExecutionLabels.actions.startService.vi}
          </Button>
        )}

        {isInProgress && (
          <Button
            className="w-full"
            size="lg"
            variant="default"
            onClick={() => onUpdateProgress?.(service._id)}
            data-testid="update-progress-btn"
          >
            {serviceExecutionLabels.actions.updateProgress.vi}
          </Button>
        )}

        <Button
          className="w-full"
          size="sm"
          variant="outline"
          onClick={() => onViewDetail(service._id)}
          data-testid="view-detail-btn"
        >
          {serviceExecutionLabels.actions.viewDetail.vi}
        </Button>
      </CardFooter>
    </Card>
  );
}
