"use client";

/**
 * Payment status badge component with color coding.
 *
 * Status badge colors per spec:
 *   pending   -> warning (yellow)
 *   confirmed -> default (green)
 *   rejected  -> destructive (red)
 *   refunded  -> outline (gray)
 *
 * vi: "Huy hieu trang thai thanh toan" / en: "Payment status badge"
 */
import { Badge } from "@medilink/ui/badge";

import type { PaymentStatus } from "../types";
import { adminPaymentLabels } from "../labels";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  locale?: "vi" | "en";
}

const STATUS_VARIANT_MAP: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  rejected: "destructive",
  refunded: "outline",
};

export function PaymentStatusBadge({
  status,
  locale = "vi",
}: PaymentStatusBadgeProps) {
  const variant = STATUS_VARIANT_MAP[status];
  const label = adminPaymentLabels.statuses[status][locale];

  return <Badge variant={variant}>{label}</Badge>;
}
