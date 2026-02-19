"use client";

/**
 * QuoteStatusBadge component — displays a quote status with color coding.
 *
 * WHY: Status needs consistent visual treatment across all quote-related
 * components. Centralizing the mapping here prevents drift between
 * quote list, detail, and dashboard views.
 */
import { Badge } from "@medilink/ui/badge";

import { quoteLabels } from "../labels";
import type { QuoteStatus } from "../types";

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const statusVariantMap: Record<
  QuoteStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  accepted: "default",
  rejected: "destructive",
  expired: "secondary",
};

/**
 * Renders a color-coded badge for a quote status with bilingual label.
 *
 * pending  -> outline (neutral)
 * accepted -> default (green/primary)
 * rejected -> destructive (red)
 * expired  -> secondary (muted)
 */
export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const label = quoteLabels.status[status];
  const variant = statusVariantMap[status];

  return (
    <Badge variant={variant} data-testid="quote-status-badge">
      {label.vi}
      {/* English label for screen readers: {label.en} */}
    </Badge>
  );
}
