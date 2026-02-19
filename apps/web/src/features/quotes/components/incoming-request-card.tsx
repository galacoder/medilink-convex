"use client";

/**
 * IncomingRequestCard component — displays a service request from a hospital.
 *
 * WHY: Providers see incoming requests in a card grid. Each card shows the
 * key details (equipment, hospital, type, priority, date) to help providers
 * decide quickly whether to quote or decline without clicking into detail.
 *
 * Two CTAs: "Submit Quote" navigates to the detail page, "Decline" opens
 * the DeclineRequestDialog inline.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { quoteLabels } from "../labels";
import type { IncomingServiceRequest, ServiceRequestPriority } from "../types";
import { DeclineRequestDialog } from "./decline-request-dialog";

interface IncomingRequestCardProps {
  request: IncomingServiceRequest;
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

/** Formats an epoch ms timestamp as Vietnamese date */
function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(epochMs));
}

export function IncomingRequestCard({ request }: IncomingRequestCardProps) {
  const router = useRouter();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const equipmentName =
    request.equipmentNameVi ?? request.equipmentNameEn ?? "—";
  const typeLabel = quoteLabels.requestType[request.type];
  const priorityLabel = quoteLabels.priority[request.priority];
  const priorityVariant = priorityVariantMap[request.priority];

  function handleSubmitQuote() {
    router.push(`/provider/service-requests/${request._id}`);
  }

  return (
    <>
      <Card data-testid="incoming-request-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{equipmentName}</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {request.hospitalOrgName ?? "—"}
            </p>
          </div>
          <Badge variant={priorityVariant}>
            {priorityLabel.vi} {/* {priorityLabel.en} */}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Request type */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {quoteLabels.info.type.vi}:
            </span>
            <span>{typeLabel.vi}</span>
          </div>

          {/* Description preview */}
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {request.descriptionVi}
          </p>

          {/* Created date */}
          <p className="text-muted-foreground text-xs">
            {quoteLabels.info.createdAt.vi}: {formatDate(request.createdAt)}
          </p>
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            size="sm"
            onClick={handleSubmitQuote}
            data-testid="submit-quote-btn"
          >
            {quoteLabels.actions.submitQuote.vi}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeclineDialog(true)}
            data-testid="decline-request-btn"
          >
            {quoteLabels.actions.declineRequest.vi}
          </Button>
        </CardFooter>
      </Card>

      <DeclineRequestDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        serviceRequestId={request._id}
      />
    </>
  );
}
