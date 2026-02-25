/**
 * Subscription status badge for the dashboard header/navigation.
 *
 * WHY: Shows the current subscription state at a glance in the
 * hospital portal header. Badge variant and color communicate
 * urgency: green=active, blue=trial, amber=grace, red=expired.
 *
 * vi: "Huy hieu trang thai dang ky cho tieu de bang dieu khien"
 * en: "Subscription status badge for dashboard header"
 */
import { Badge } from "@medilink/ui/badge";

import type { SubscriptionStatus } from "../types";
import { BILLING_LABELS, STATUS_LABELS } from "../labels";

interface SubscriptionStatusBadgeProps {
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Days remaining until expiry (shown for trial and grace_period) */
  daysRemaining?: number | null;
}

/**
 * Status-specific CSS class overrides for badge colors.
 * The shadcn Badge only has default/secondary/destructive/outline variants,
 * so we apply custom amber/gray classes for grace_period and suspended.
 */
const STATUS_CLASSES: Record<SubscriptionStatus, string> = {
  active: "",
  trial: "",
  grace_period:
    "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  expired: "",
  suspended: "text-muted-foreground",
};

export function SubscriptionStatusBadge({
  status,
  daysRemaining,
}: SubscriptionStatusBadgeProps) {
  const config = STATUS_LABELS[status];
  const showDays =
    daysRemaining != null && (status === "trial" || status === "grace_period");

  const daysText = showDays
    ? ` - ${BILLING_LABELS.daysRemaining(daysRemaining).vi} / ${BILLING_LABELS.daysRemaining(daysRemaining).en}`
    : "";

  return (
    <Badge variant={config.variant} className={STATUS_CLASSES[status]}>
      {config.vi} / {config.en}
      {daysText}
    </Badge>
  );
}
