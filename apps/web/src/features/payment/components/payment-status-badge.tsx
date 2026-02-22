import { cn } from "@medilink/ui";
import { Badge } from "@medilink/ui/badge";

import type { PaymentStatus } from "../types";
import { paymentLabels } from "../labels";

/**
 * Color map for payment statuses.
 *
 * WHY: Consistent color coding for payment status:
 * yellow=pending, green=completed, red=failed, purple=refunded.
 *
 * vi: "Ban do mau trang thai thanh toan" / en: "Payment status color map"
 */
const statusColorMap: Record<PaymentStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  completed:
    "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  failed: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  refunded:
    "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200",
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  locale?: "vi" | "en";
  className?: string;
}

/**
 * Color-coded badge for payment status.
 *
 * WHY: Consistent color coding across payment list lets staff
 * identify payment status at a glance.
 *
 * vi: "Huy hieu trang thai thanh toan" / en: "Payment status badge"
 */
export function PaymentStatusBadge({
  status,
  locale = "vi",
  className,
}: PaymentStatusBadgeProps) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const label = paymentLabels.statuses[status]?.[locale] ?? status;
  return (
    <Badge className={cn("border", statusColorMap[status], className)}>
      {label}
    </Badge>
  );
}
