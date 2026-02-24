"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { Id } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";

import type { DisputeStatus } from "~/features/disputes/types";
import { useSession } from "~/auth/client";
import { DisputeStatusBadge } from "~/features/disputes/components/dispute-status-badge";
import { EscalationButton } from "~/features/disputes/components/escalation-button";
import { MessageThread } from "~/features/disputes/components/message-thread";
import { useDisputeDetail } from "~/features/disputes/hooks/use-dispute-detail";
import { disputeLabels } from "~/features/disputes/labels";

/**
 * Hospital dispute detail page.
 *
 * WHY: After finding a dispute in the list, staff need to see all details,
 * the full message thread with the provider, and take action (escalate).
 *
 * 2-column layout (lg:grid-cols-3):
 *   Main (col-span-2): Dispute info card + MessageThread
 *   Sidebar: Status badge + EscalationButton + timestamps
 *
 * vi: "Trang chi tiết khiếu nại" / en: "Dispute Detail Page"
 */
export default function DisputeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const { dispute, isLoading } = useDisputeDetail(
    id ? (id as Id<"disputes">) : undefined,
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <span className="text-muted-foreground">/</span>
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Not found
  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          Không tìm thấy khiếu nại{" "}
          <span className="text-muted-foreground text-base font-normal">
            (Dispute not found)
          </span>
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/hospital/disputes">{disputeLabels.backToList.vi}</Link>
        </Button>
      </div>
    );
  }

  const typeLabel =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    disputeLabels.types[dispute.type]?.vi ?? dispute.type;

  // Truncate description for breadcrumb
  const breadcrumbDesc =
    dispute.descriptionVi.length > 50
      ? dispute.descriptionVi.slice(0, 47) + "..."
      : dispute.descriptionVi;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/hospital/disputes"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {disputeLabels.backToList.vi}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="max-w-[300px] truncate font-medium">
          {breadcrumbDesc}
        </span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {typeLabel}{" "}
            <span className="text-muted-foreground text-base font-normal">
              ({disputeLabels.types[dispute.type].en})
            </span>
          </h1>
        </div>
        <DisputeStatusBadge status={dispute.status as DisputeStatus} />
      </div>

      {/* Main content — 2 column layout on lg screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column (col-span-2): Dispute info + message thread */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dispute info card */}
          <div className="space-y-4 rounded-lg border p-5">
            <h2 className="text-base font-semibold">
              {disputeLabels.detail.disputeInfo.vi}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                ({disputeLabels.detail.disputeInfo.en})
              </span>
            </h2>

            {/* Description */}
            <div>
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                {disputeLabels.fields.descriptionVi.vi}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {dispute.descriptionVi}
              </p>
              {dispute.descriptionEn && (
                <p className="text-muted-foreground mt-1 text-sm italic">
                  {dispute.descriptionEn}
                </p>
              )}
            </div>

            {/* Linked service request */}
            {dispute.serviceRequest && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  {disputeLabels.detail.linkedRequest.vi}
                </p>
                <p className="text-sm">
                  {dispute.serviceRequest.descriptionVi}
                </p>
                {dispute.equipmentName && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {disputeLabels.fields.equipment.vi}: {dispute.equipmentName}
                  </p>
                )}
              </div>
            )}

            {/* Resolution notes */}
            {dispute.resolutionNotes && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  {disputeLabels.fields.resolutionNotes.vi}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {dispute.resolutionNotes}
                </p>
              </div>
            )}
          </div>

          {/* Message thread */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">
              {disputeLabels.thread.title.vi}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                ({disputeLabels.thread.title.en})
              </span>
            </h2>
            <MessageThread
              disputeId={dispute._id}
              currentUserId={session?.user.id}
            />
          </div>
        </div>

        {/* Sidebar: Status + Escalation + Timestamps */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-semibold">
              {disputeLabels.detail.statusInfo.vi}
            </h2>

            {/* Current status */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                {disputeLabels.fields.status.vi}
              </p>
              <DisputeStatusBadge status={dispute.status as DisputeStatus} />
            </div>

            {/* Organization */}
            {dispute.organizationName && (
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs">
                  {disputeLabels.fields.organization.vi}
                </p>
                <p className="text-sm font-medium">
                  {dispute.organizationName}
                </p>
              </div>
            )}

            {/* Assigned to */}
            {dispute.assignedToName && (
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs">
                  {disputeLabels.fields.assignedTo.vi}
                </p>
                <p className="text-sm">{dispute.assignedToName}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2 border-t pt-3">
              <div>
                <p className="text-muted-foreground text-xs">
                  {disputeLabels.fields.createdAt.vi}
                </p>
                <p className="text-sm">
                  {new Date(dispute.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">
                  {disputeLabels.fields.updatedAt.vi}
                </p>
                <p className="text-sm">
                  {new Date(dispute.updatedAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {dispute.resolvedAt && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    {disputeLabels.fields.resolvedAt.vi}
                  </p>
                  <p className="text-sm">
                    {new Date(dispute.resolvedAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Escalation */}
          <EscalationButton
            disputeId={dispute._id}
            status={dispute.status as DisputeStatus}
          />
        </div>
      </div>
    </div>
  );
}
