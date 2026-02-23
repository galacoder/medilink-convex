"use client";

/**
 * Platform admin dispute detail page with arbitration action panel.
 *
 * Shows full dispute information including:
 * - Both hospital and provider perspectives
 * - Message thread as evidence
 * - Arbitration history (past decisions)
 * - Arbitration action panel for submitting a ruling
 *
 * vi: "Trang chi tiết tranh chấp và trọng tài" / en: "Dispute detail & arbitration page"
 */
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  ShieldIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";

import type { Id } from "@medilink/db/dataModel";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Separator } from "@medilink/ui/separator";

import type { ArbitrationRulingForm } from "~/features/admin-disputes";
import {
  adminDisputeLabels,
  ArbitrationPanel,
  useDisputeArbitrationDetail,
  useResolveDispute,
} from "~/features/admin-disputes";

interface AdminDisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Dispute detail page for platform admin arbitration.
 *
 * WHY: Using params as a Promise follows the Next.js 15 App Router convention
 * where route params are async. The `use()` hook unwraps the Promise.
 */
export default function AdminDisputeDetailPage({
  params,
}: AdminDisputeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useDisputeArbitrationDetail returns DisputeArbitrationDetail | null | undefined (typed in hook)
  const detail = useDisputeArbitrationDetail(id as Id<"disputes">);
  const resolveDispute = useResolveDispute();

  const isLoading = detail === undefined;

  async function handleSubmitRuling(ruling: ArbitrationRulingForm) {
    setIsSubmitting(true);
    try {
      await resolveDispute({
        disputeId: id as Id<"disputes">,
        resolution: ruling.resolution,
        reasonVi: ruling.reasonVi,
        reasonEn: ruling.reasonEn,
        refundAmount: ruling.refundAmount,
      });
      setSuccessMessage(adminDisputeLabels.successRuling.vi);
      // Navigate back to the disputes list after successful ruling
      setTimeout(() => router.push("/admin/disputes"), 1500);
    } catch {
      // Error handling is implicit — Convex will throw ConvexError if not authorized
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-48 w-full animate-pulse rounded" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">
          Không tìm thấy tranh chấp {/* Dispute not found */}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/disputes">
            {adminDisputeLabels.actions.backToDisputes.vi}
          </Link>
        </Button>
      </div>
    );
  }

  const {
    dispute,
    hospitalOrganization,
    providerOrganization,
    serviceRequest,
    equipment,
    messages,
    arbitrationHistory,
  } = detail;

  // WHY: disputeStatuses covers all DisputeStatus values exhaustively — no optional chain needed.
  const statusLabel = adminDisputeLabels.disputeStatuses[dispute.status].vi;
  const isEscalated = dispute.status === "escalated";
  const isResolved = dispute.status === "resolved";

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back navigation */}
      <Button variant="ghost" size="sm" className="gap-1" asChild>
        <Link href="/admin/disputes">
          <ArrowLeftIcon className="h-4 w-4" />
          {adminDisputeLabels.actions.backToDisputes.vi}
        </Link>
      </Button>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {adminDisputeLabels.titles.disputeDetail.vi}
            {/* Dispute Detail & Arbitration */}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm text-xs">
            {dispute._id}
          </p>
        </div>
        <Badge
          className={
            isEscalated
              ? "bg-red-100 text-red-800"
              : isResolved
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
          }
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: dispute info + evidence */}
        <div className="space-y-6 lg:col-span-2">
          {/* Both perspectives */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Hospital perspective */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BuildingIcon className="h-4 w-4" />
                  {adminDisputeLabels.arbitration.hospitalPerspective.vi}
                  {/* Hospital Perspective */}
                </CardTitle>
                <CardDescription>
                  {hospitalOrganization?.name ?? "—"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{dispute.descriptionVi}</p>
              </CardContent>
            </Card>

            {/* Provider perspective */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TruckIcon className="h-4 w-4" />
                  {adminDisputeLabels.arbitration.providerPerspective.vi}
                  {/* Provider Perspective */}
                </CardTitle>
                <CardDescription>
                  {providerOrganization?.name ?? "—"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {/* Provider's side shown through message thread below */}
                  Xem luồng tin nhắn bên dưới {/* See message thread below */}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service request info */}
          {serviceRequest && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardListIcon className="h-4 w-4" />
                  Yêu cầu dịch vụ liên quan {/* Linked Service Request */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Loại {/* Type */}
                  </span>
                  <span className="capitalize">{serviceRequest.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Trạng thái {/* Status */}
                  </span>
                  <span>
                    {
                      // WHY: serviceRequestStatuses covers all status values — no optional chain needed.
                      adminDisputeLabels.serviceRequestStatuses[
                        serviceRequest.status
                      ].vi
                    }
                  </span>
                </div>
                {equipment && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <WrenchIcon className="h-3 w-3" />
                      Thiết bị {/* Equipment */}
                    </span>
                    <span>{equipment.nameVi}</span>
                  </div>
                )}
                <Separator />
                <p>{serviceRequest.descriptionVi}</p>
              </CardContent>
            </Card>
          )}

          {/* Message thread — evidence for arbitration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquareIcon className="h-4 w-4" />
                {adminDisputeLabels.arbitration.evidence.vi} {/* Evidence */}
              </CardTitle>
              <CardDescription>
                {messages.length} tin nhắn {/* messages */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa có tin nhắn nào {/* No messages yet */}
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="rounded-md bg-gray-50 p-3 text-sm"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">
                          {msg.authorName ?? "—"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(msg.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p>{msg.contentVi}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arbitration history */}
          {arbitrationHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldIcon className="h-4 w-4" />
                  {adminDisputeLabels.titles.arbitrationHistory.vi}
                  {/* Arbitration History */}
                </CardTitle>
                <CardDescription>
                  {adminDisputeLabels.empty.noArbitrationHistory.vi}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {arbitrationHistory.map((entry) => (
                    <div
                      key={entry._id}
                      className="border-l-2 border-gray-200 pl-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium">
                          {entry.action}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(entry.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      {entry.newValues && (
                        <p className="text-muted-foreground text-xs">
                          {JSON.stringify(entry.newValues).slice(0, 100)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: arbitration action panel */}
        <div className="lg:col-span-1">
          {isEscalated && !successMessage ? (
            <ArbitrationPanel
              onSubmitRuling={handleSubmitRuling}
              isSubmitting={isSubmitting}
            />
          ) : isResolved ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-green-700">
                  Tranh chấp đã được giải quyết{" "}
                  {/* Dispute has been resolved */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {dispute.resolutionNotes ?? "—"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm">
                  Không thể trọng tài {/* Cannot arbitrate */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Chỉ có thể trọng tài tranh chấp ở trạng thái "leo thang"
                  {/* Can only arbitrate disputes in "escalated" status */}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
