/**
 * Subscription detail card for the detail view page.
 *
 * Shows current subscription info: plan, status, dates, usage stats.
 *
 * vi: "The chi tiet dang ky" / en: "Subscription detail card"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import Link from "next/link";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Separator } from "@medilink/ui/separator";

import type { OrganizationBillingDetail } from "../types";
import { billingLabels } from "../labels";
import { StatusBadge } from "./status-badge";

interface SubscriptionDetailCardProps {
  detail: OrganizationBillingDetail;
  locale?: "vi" | "en";
}

/** Format timestamp to localized date string */
function formatDate(timestamp: number | null, locale: "vi" | "en"): string {
  if (!timestamp) return "--";
  return new Date(timestamp).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
}

/** Format VND amount with Vietnamese formatting */
function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

/** Get plan label */
function getPlanLabel(plan: string | null, locale: "vi" | "en"): string {
  if (!plan) return "--";
  const labels: Record<string, { vi: string; en: string }> = {
    starter: billingLabels.planStarter,
    professional: billingLabels.planProfessional,
    enterprise: billingLabels.planEnterprise,
    trial: billingLabels.planTrial,
  };
  return labels[plan]?.[locale] ?? plan;
}

/** Get billing cycle label */
function getCycleLabel(cycle: string | null, locale: "vi" | "en"): string {
  if (!cycle) return "--";
  const labels: Record<string, { vi: string; en: string }> = {
    monthly_3: billingLabels.cycle3,
    monthly_6: billingLabels.cycle6,
    monthly_12: billingLabels.cycle12,
  };
  return labels[cycle]?.[locale] ?? cycle;
}

/** Format a seat count (-1 means unlimited) */
function formatLimit(value: number | null, locale: "vi" | "en"): string {
  if (value == null) return "--";
  if (value === -1) return billingLabels.unlimited[locale];
  return String(value);
}

/**
 * Renders the full subscription detail card with usage stats and action buttons.
 *
 * vi: "Hien thi the chi tiet dang ky day du"
 * en: "Display full subscription detail card"
 */
export function SubscriptionDetailCard({
  detail,
  locale = "vi",
}: SubscriptionDetailCardProps) {
  const L = billingLabels;
  const org = detail.organization;
  const orgId = org._id;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">{org.name}</CardTitle>
            <CardDescription>{org.slug}</CardDescription>
          </div>
          <StatusBadge
            status={
              org.status as
                | "active"
                | "trial"
                | "grace_period"
                | "expired"
                | "suspended"
            }
            locale={locale}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription info grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label={L.plan[locale]}
            value={getPlanLabel(org.subscriptionPlan, locale)}
          />
          <InfoItem
            label={L.billingCycle[locale]}
            value={getCycleLabel(org.billingCycle, locale)}
          />
          <InfoItem
            label={L.expires[locale]}
            value={formatDate(org.subscriptionExpiresAt, locale)}
          />
          <InfoItem
            label={L.staffSeats[locale]}
            value={`${detail.staffCount} / ${formatLimit(org.maxStaffSeats, locale)}`}
          />
          <InfoItem
            label={L.equipment[locale]}
            value={`${detail.equipmentCount} / ${formatLimit(org.maxEquipment, locale)}`}
          />
          {detail.aiCredits && (
            <InfoItem
              label={L.aiCredits[locale]}
              value={`${detail.aiCredits.balance} / ${detail.aiCredits.monthlyIncluded} (${detail.aiCredits.monthlyUsed} ${locale === "vi" ? "da dung" : "used"})`}
            />
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {(org.status === "trial" || org.status === "expired") && (
            <Button asChild>
              <Link href={`/admin/billing/${orgId}/activate`}>
                {L.activate[locale]}
              </Link>
            </Button>
          )}
          {(org.status === "active" || org.status === "grace_period") && (
            <Button asChild>
              <Link href={`/admin/billing/${orgId}/extend`}>
                {L.extend[locale]}
              </Link>
            </Button>
          )}
          {org.status === "suspended" && (
            <Button variant="outline" asChild>
              <Link href={`/admin/billing/${orgId}`}>
                {L.reactivate[locale]}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helper sub-component
// ---------------------------------------------------------------------------

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
