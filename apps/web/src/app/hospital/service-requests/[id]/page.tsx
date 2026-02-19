"use client";

/**
 * Service request detail page.
 *
 * WHY: Hospital staff view all details of a service request here: equipment
 * info, workflow timeline, provider quotes with accept/reject actions, and
 * the service rating (if completed). Real-time updates via Convex subscription
 * mean the page refreshes automatically when a provider submits a quote.
 *
 * Route: /hospital/service-requests/[id]
 */
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@medilink/ui/alert-dialog";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import type {
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "~/features/service-requests/types";
import { QuotesList } from "~/features/service-requests/components/quotes-list";
import { ServiceRatingForm } from "~/features/service-requests/components/service-rating-form";
import { StatusTimeline } from "~/features/service-requests/components/status-timeline";
import { useServiceRequestDetail } from "~/features/service-requests/hooks/use-service-request-detail";
import { useServiceRequestMutations } from "~/features/service-requests/hooks/use-service-request-mutations";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

const labels = serviceRequestLabels;

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

const priorityBadgeVariant: Record<
  ServiceRequestPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isCancelling, setIsCancelling] = useState(false);

  const { detail, isLoading, notFound } = useServiceRequestDetail(id);
  const { cancelRequest, acceptQuote, rejectQuote, rateService } =
    useServiceRequestMutations();

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await cancelRequest(id);
      router.push("/hospital/service-requests");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{labels.errors.notFound.vi}</h1>
        <Button asChild variant="outline">
          <Link href="/hospital/service-requests">
            ← {labels.buttons.back.vi}
          </Link>
        </Button>
      </div>
    );
  }

  const canCancel = ["pending", "quoted", "accepted"].includes(detail.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/hospital/service-requests">
                ← {labels.buttons.back.vi}
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold">{labels.pages.detail.vi}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {detail._id}
          </p>
        </div>

        {/* Cancel button */}
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                {isCancelling
                  ? labels.buttons.cancelling.vi
                  : labels.buttons.cancel.vi}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {labels.buttons.cancelConfirmTitle.vi}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {labels.buttons.cancelConfirmDesc.vi}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{labels.buttons.back.vi}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {labels.buttons.cancel.vi}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left column: request info + quotes */}
        <div className="space-y-6">
          {/* Request info card */}
          <Card data-testid="request-info">
            <CardHeader>
              <CardTitle className="text-base">
                {labels.common.requestId.vi}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Equipment */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {labels.common.equipment.vi}
                </span>
                <Link
                  href={`/hospital/equipment/${detail.equipmentId}`}
                  className="text-primary font-medium hover:underline"
                >
                  {detail.equipment?.nameVi ?? labels.common.noDescription.vi}
                </Link>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {labels.table.status.vi}
                </span>
                <Badge variant={statusBadgeVariant[detail.status]}>
                  {labels.status[detail.status].vi}
                </Badge>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {labels.table.priority.vi}
                </span>
                <Badge variant={priorityBadgeVariant[detail.priority]}>
                  {labels.priority[detail.priority].vi}
                </Badge>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {labels.table.type.vi}
                </span>
                <span className="text-sm">{labels.type[detail.type].vi}</span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">
                  {labels.form.description.vi}
                </span>
                <p className="text-sm whitespace-pre-wrap">
                  {detail.descriptionVi}
                </p>
              </div>

              {/* Hospital */}
              {detail.hospitalOrgName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {labels.common.hospital.vi}
                  </span>
                  <span className="text-sm">{detail.hospitalOrgName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes section */}
          <div data-testid="quotes-section">
            <h2 className="mb-4 text-lg font-semibold">
              {labels.quotes.title.vi}
            </h2>
            <QuotesList
              quotes={detail.quotes}
              onAccept={acceptQuote}
              onReject={rejectQuote}
            />
          </div>

          {/* Rating section — only shown when completed and not yet rated */}
          {detail.status === "completed" && !detail.rating && (
            <Card data-testid="rating-section">
              <CardHeader>
                <CardTitle className="text-base">
                  {labels.rating.title.vi}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceRatingForm onSubmit={(data) => rateService(id, data)} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: timeline */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {labels.timeline.title.vi}
          </h2>
          <StatusTimeline currentStatus={detail.status} />
        </div>
      </div>
    </div>
  );
}
