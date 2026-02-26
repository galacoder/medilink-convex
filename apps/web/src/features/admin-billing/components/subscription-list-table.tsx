/**
 * Subscription list data table.
 *
 * Displays all organizations with their subscription status,
 * plan info, expiry dates, and context-sensitive action buttons.
 *
 * vi: "Bang danh sach dang ky" / en: "Subscription list table"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import Link from "next/link";

import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { OrganizationSubscriptionRow } from "../types";
import { billingLabels } from "../labels";
import { StatusBadge } from "./status-badge";

interface SubscriptionListTableProps {
  organizations: OrganizationSubscriptionRow[];
  isLoading: boolean;
  locale?: "vi" | "en";
}

/**
 * Format timestamp to localized date string.
 * vi: "Dinh dang ngay thang" / en: "Format date"
 */
function formatDate(timestamp: number | null, locale: "vi" | "en"): string {
  if (!timestamp) return "--";
  return new Date(timestamp).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { year: "numeric", month: "2-digit", day: "2-digit" },
  );
}

/**
 * Get plan display label.
 * vi: "Lay nhan hien thi goi" / en: "Get plan display label"
 */
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

/**
 * Renders the subscription list table with action buttons.
 *
 * vi: "Hien thi bang danh sach dang ky"
 * en: "Display subscription list table"
 */
export function SubscriptionListTable({
  organizations,
  isLoading,
  locale = "vi",
}: SubscriptionListTableProps) {
  const L = billingLabels;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {L.noOrganizations[locale]}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{L.organization[locale]}</TableHead>
            <TableHead>{L.plan[locale]}</TableHead>
            <TableHead>{L.status[locale]}</TableHead>
            <TableHead>{L.expires[locale]}</TableHead>
            <TableHead>{L.staffSeats[locale]}</TableHead>
            <TableHead className="text-right">{L.actions[locale]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org._id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>
                {getPlanLabel(org.subscriptionPlan, locale)}
              </TableCell>
              <TableCell>
                <StatusBadge status={org.status} locale={locale} />
              </TableCell>
              <TableCell>
                {formatDate(org.subscriptionExpiresAt, locale)}
              </TableCell>
              <TableCell>
                {org.staffCount}
                {org.maxStaffSeats != null && org.maxStaffSeats > 0
                  ? `/${org.maxStaffSeats === -1 ? "\u221E" : org.maxStaffSeats}`
                  : ""}
              </TableCell>
              <TableCell className="text-right">
                <ActionButtons
                  orgId={org._id}
                  status={org.status}
                  locale={locale}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context-sensitive action buttons
// ---------------------------------------------------------------------------

interface ActionButtonsProps {
  orgId: string;
  status: string;
  locale: "vi" | "en";
}

/**
 * Renders action buttons based on current subscription status.
 *
 * vi: "Hien thi nut thao tac theo trang thai"
 * en: "Display action buttons based on status"
 */
function ActionButtons({ orgId, status, locale }: ActionButtonsProps) {
  const L = billingLabels;

  return (
    <div className="flex items-center justify-end gap-1">
      {/* View is always available */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/billing/${orgId}`}>{L.view[locale]}</Link>
      </Button>

      {/* Activate: for trial, expired */}
      {(status === "trial" || status === "expired") && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/billing/${orgId}/activate`}>
            {L.activate[locale]}
          </Link>
        </Button>
      )}

      {/* Extend: for active, grace_period */}
      {(status === "active" || status === "grace_period") && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/billing/${orgId}/extend`}>
            {L.extend[locale]}
          </Link>
        </Button>
      )}
    </div>
  );
}
