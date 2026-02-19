"use client";

/**
 * Provider service request detail page.
 *
 * WHY: After seeing an IncomingRequestCard, providers navigate here to see
 * full details (equipment, hospital, issue description, urgency) before
 * committing to a quote. The QuoteForm is embedded here for submission,
 * and DeclineRequestDialog is available if the provider chooses to pass.
 *
 * Real-time via Convex useQuery — updates when hospital or other providers
 * take actions on the same request.
 *
 * vi: "Chi tiết yêu cầu dịch vụ" / en: "Service Request Detail"
 */
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Separator } from "@medilink/ui/separator";
import { Skeleton } from "@medilink/ui/skeleton";

import { useServiceRequestDetail } from "~/features/service-requests/hooks/use-service-request-detail";
import { QuoteForm } from "~/features/quotes/components/quote-form";
import { QuoteStatusBadge } from "~/features/quotes/components/quote-status-badge";
import { quoteLabels } from "~/features/quotes/labels";

/** Formats epoch ms as Vietnamese date */
function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochMs));
}

/** Formats a number as Vietnamese Dong */
function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function ProviderServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;

  const { detail, isLoading, notFound } = useServiceRequestDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="provider-request-detail">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="space-y-4" data-testid="provider-request-detail">
        <p className="text-muted-foreground">
          Không tìm thấy yêu cầu dịch vụ (Service request not found)
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          {quoteLabels.actions.back.vi}
        </Button>
      </div>
    );
  }

  const equipmentName =
    detail.equipment?.nameVi ??
    detail.equipment?.nameEn ??
    "—";

  const priorityLabel = quoteLabels.priority[
    detail.priority as keyof typeof quoteLabels.priority
  ];
  const typeLabel = quoteLabels.requestType[
    detail.type as keyof typeof quoteLabels.requestType
  ];

  const canQuote = detail.status === "pending" || detail.status === "quoted";

  return (
    <div className="space-y-6" data-testid="provider-request-detail">
      {/* Back navigation + header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          ← {quoteLabels.actions.back.vi}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">
          {quoteLabels.page.requestDetail.vi}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {quoteLabels.info.description.vi}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Equipment */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quoteLabels.info.equipment.vi}
              </span>
              <span className="font-medium">{equipmentName}</span>
            </div>

            {/* Hospital */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quoteLabels.info.hospital.vi}
              </span>
              <span className="font-medium">
                {detail.hospitalOrgName ?? "—"}
              </span>
            </div>

            {/* Type */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quoteLabels.info.type.vi}
              </span>
              <span>{typeLabel.vi}</span>
            </div>

            {/* Priority */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quoteLabels.info.priority.vi}
              </span>
              <Badge
                variant={
                  detail.priority === "critical"
                    ? "destructive"
                    : detail.priority === "high"
                      ? "default"
                      : "secondary"
                }
              >
                {priorityLabel.vi}
              </Badge>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {quoteLabels.info.description.vi}
              </p>
              <p className="text-sm">{detail.descriptionVi}</p>
            </div>

            {/* Created date */}
            <div className="text-muted-foreground text-xs">
              {quoteLabels.info.createdAt.vi}: {formatDate(detail.createdAt)}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Quote Form or already-submitted quotes */}
        <div className="space-y-4">
          {canQuote ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {quoteLabels.actions.submitQuote.vi}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteForm
                  serviceRequestId={detail._id}
                  onSuccess={() => router.push("/provider/quotes")}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">
                  Yêu cầu này không còn nhận báo giá (trạng thái:{" "}
                  {quoteLabels.requestStatus[
                    detail.status as keyof typeof quoteLabels.requestStatus
                  ].vi}
                  )
                </p>
              </CardContent>
            </Card>
          )}

          {/* Provider's own submitted quotes for this request */}
          {detail.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Báo giá đã gửi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.quotes.map((quote) => (
                  <div
                    key={quote._id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{formatVND(quote.amount)}</p>
                      {quote.notes && (
                        <p className="text-muted-foreground text-xs">
                          {quote.notes}
                        </p>
                      )}
                    </div>
                    <QuoteStatusBadge
                      status={
                        quote.status as "pending" | "accepted" | "rejected" | "expired"
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
