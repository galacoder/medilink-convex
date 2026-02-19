"use client";

/**
 * ServiceRequestTable component — displays hospital service requests in a grid.
 *
 * WHY: Modeled after MembersTable for consistency. Shows status and priority
 * as colored badges, equipment name in Vietnamese (primary), and links to
 * the detail page. Loading skeleton and empty state prevent layout shift.
 *
 * Responsive: on mobile the date column is hidden; equipment name wraps.
 */
import Link from "next/link";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";

import type {
  ServiceRequest,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "../types";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

interface ServiceRequestTableProps {
  requests: ServiceRequest[];
  isLoading?: boolean;
}

// Badge variant mapping per status
const statusBadgeVariant: Record<
  ServiceRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  quoted: "secondary",
  accepted: "default",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
};

// Badge variant mapping per priority
const priorityBadgeVariant: Record<
  ServiceRequestPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

const labels = serviceRequestLabels;

export function ServiceRequestTable({
  requests,
  isLoading = false,
}: ServiceRequestTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-6 py-10 text-center text-sm">
        {labels.table.empty.vi}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      {/* Table header */}
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 text-xs font-medium tracking-wide uppercase">
        <span>{labels.table.equipment.vi}</span>
        <span className="hidden sm:block">{labels.table.type.vi}</span>
        <span>{labels.table.priority.vi}</span>
        <span>{labels.table.status.vi}</span>
        <span className="sr-only">{labels.table.actions.vi}</span>
      </div>

      {/* Table rows */}
      <ul className="divide-y">
        {requests.map((request) => (
          <li
            key={request._id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 text-sm"
          >
            {/* Equipment name */}
            <div>
              <span className="font-medium">
                {request.equipmentNameVi ?? labels.common.noDescription.vi}
              </span>
              {/* Service type on mobile */}
              <p className="text-muted-foreground text-xs sm:hidden">
                {labels.type[request.type].vi}
              </p>
            </div>

            {/* Service type (desktop) */}
            <span className="text-muted-foreground hidden sm:block">
              {labels.type[request.type].vi}
            </span>

            {/* Priority badge */}
            <Badge variant={priorityBadgeVariant[request.priority]}>
              {labels.priority[request.priority].vi}
            </Badge>

            {/* Status badge */}
            <Badge variant={statusBadgeVariant[request.status]}>
              {labels.status[request.status].vi}
            </Badge>

            {/* View link */}
            <Button asChild variant="ghost" size="sm">
              <Link href={`/hospital/service-requests/${request._id}`}>
                {labels.table.view.vi}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
