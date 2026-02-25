/**
 * Color-coded status badge for subscription statuses.
 *
 * Maps subscription status to shadcn Badge variants:
 *   active       -> default (green)
 *   trial        -> secondary (blue)
 *   grace_period -> warning (yellow/orange outline)
 *   expired      -> destructive (red)
 *   suspended    -> outline (gray)
 *
 * vi: "Huy hieu trang thai dang ky" / en: "Subscription status badge"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { Badge } from "@medilink/ui/badge";

import type { OrgSubscriptionStatus } from "../types";

/** Badge variant mapping per status */
const STATUS_CONFIG: Record<
  OrgSubscriptionStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    labelVi: string;
    labelEn: string;
  }
> = {
  active: {
    variant: "default",
    className: "bg-green-600 hover:bg-green-700",
    labelVi: "HOAT DONG",
    labelEn: "ACTIVE",
  },
  trial: {
    variant: "secondary",
    className: "bg-blue-600 text-white hover:bg-blue-700",
    labelVi: "DUNG THU",
    labelEn: "TRIAL",
  },
  grace_period: {
    variant: "outline",
    className:
      "border-amber-500 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
    labelVi: "GIA HAN",
    labelEn: "GRACE",
  },
  expired: {
    variant: "destructive",
    className: "",
    labelVi: "HET HAN",
    labelEn: "EXPIRED",
  },
  suspended: {
    variant: "outline",
    className: "text-muted-foreground",
    labelVi: "TAM NGUNG",
    labelEn: "SUSPENDED",
  },
};

interface StatusBadgeProps {
  status: OrgSubscriptionStatus;
  locale?: "vi" | "en";
}

/**
 * Renders a color-coded badge for subscription status.
 *
 * vi: "Hien thi huy hieu mau theo trang thai"
 * en: "Display color-coded status badge"
 */
export function StatusBadge({ status, locale = "vi" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const label = locale === "vi" ? config.labelVi : config.labelEn;

  return (
    <Badge variant={config.variant} className={config.className}>
      {label}
    </Badge>
  );
}
