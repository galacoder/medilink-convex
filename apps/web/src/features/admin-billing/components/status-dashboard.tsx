/**
 * Status dashboard cards showing subscription status counts.
 *
 * Displays summary cards: Active, Trial, Grace, Expired, Suspended
 * with counts and attention items.
 *
 * vi: "Bang dieu khien trang thai" / en: "Status dashboard"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";

import type {
  OrganizationSubscriptionRow,
  OrgSubscriptionStatus,
} from "../types";
import { billingLabels } from "../labels";

interface StatusDashboardProps {
  organizations: OrganizationSubscriptionRow[];
  locale?: "vi" | "en";
}

/** Status card configuration */
const STATUS_CARDS: {
  status: OrgSubscriptionStatus;
  labelKey: keyof typeof billingLabels;
  colorClass: string;
}[] = [
  { status: "active", labelKey: "statusActive", colorClass: "text-green-600" },
  { status: "trial", labelKey: "statusTrial", colorClass: "text-blue-600" },
  {
    status: "grace_period",
    labelKey: "statusGracePeriod",
    colorClass: "text-amber-600",
  },
  {
    status: "expired",
    labelKey: "statusExpired",
    colorClass: "text-red-600",
  },
  {
    status: "suspended",
    labelKey: "statusSuspended",
    colorClass: "text-gray-500",
  },
];

/**
 * Renders summary cards with org counts per subscription status.
 *
 * vi: "Hien thi the tong hop theo trang thai"
 * en: "Display summary cards by status"
 */
export function StatusDashboard({
  organizations,
  locale = "vi",
}: StatusDashboardProps) {
  const L = billingLabels;

  // Count orgs per status
  const counts = organizations.reduce<Record<OrgSubscriptionStatus, number>>(
    (acc, org) => {
      acc[org.status] = (acc[org.status] ?? 0) + 1;
      return acc;
    },
    { active: 0, trial: 0, grace_period: 0, expired: 0, suspended: 0 },
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {STATUS_CARDS.map((card) => (
        <Card key={card.status}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {L[card.labelKey][locale]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${card.colorClass}`}>
              {counts[card.status]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
