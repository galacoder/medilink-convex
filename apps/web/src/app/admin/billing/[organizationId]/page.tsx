/**
 * Admin subscription detail page — /admin/billing/[organizationId]
 *
 * Shows full subscription detail for a single organization:
 * current subscription info, usage stats, subscription history,
 * payment history, and action buttons.
 *
 * vi: "Trang chi tiet dang ky — Quan tri vien nen tang"
 * en: "Subscription detail page — Platform Admin"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { Id } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";

import {
  billingLabels,
  PaymentHistoryTable,
  ReactivateDialog,
  SubscriptionDetailCard,
  SubscriptionHistoryTable,
  SuspendDialog,
  useBillingDetail,
} from "~/features/admin-billing";

/**
 * Subscription detail page for a single organization.
 *
 * vi: "Trang chi tiet dang ky cho mot to chuc"
 * en: "Subscription detail page for a single organization"
 */
export default function BillingDetailPage() {
  const params = useParams<{ organizationId: string }>();
  const locale = "vi" as "vi" | "en";
  const L = billingLabels;

  const organizationId = params.organizationId as Id<"organizations">;
  const { detail, isLoading } = useBillingDetail(organizationId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{L.detailTitle[locale]}</h1>
        <p className="text-muted-foreground">
          {locale === "vi"
            ? "Khong tim thay to chuc"
            : "Organization not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/billing">
            {locale === "vi" ? "Quay lai" : "Back"}
          </Link>
        </Button>
      </div>
    );
  }

  const org = detail.organization;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/billing">
            {locale === "vi" ? "\u2190 Danh sach" : "\u2190 Back to list"}
          </Link>
        </Button>
      </div>

      {/* Page header with action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {org.name} - {L.detailTitle[locale]}
        </h1>
        <div className="flex gap-2">
          {(org.status === "active" ||
            org.status === "trial" ||
            org.status === "grace_period") && (
            <SuspendDialog
              organizationId={organizationId}
              organizationName={org.name}
              locale={locale}
            />
          )}
          {(org.status === "suspended" || org.status === "grace_period") && (
            <ReactivateDialog
              organizationId={organizationId}
              organizationName={org.name}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Current subscription detail */}
      <SubscriptionDetailCard detail={detail} locale={locale} />

      {/* Subscription history */}
      <SubscriptionHistoryTable
        history={detail.subscriptionHistory}
        locale={locale}
      />

      {/* Payment history */}
      <PaymentHistoryTable payments={detail.paymentHistory} locale={locale} />
    </div>
  );
}
