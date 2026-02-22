import { cn } from "@medilink/ui";
import { Badge } from "@medilink/ui/badge";

import type { SupportTicketStatus } from "../types";
import { supportLabels } from "../labels";

/**
 * Color map for support ticket statuses.
 *
 * WHY: Consistent color coding allows staff to identify ticket status at a glance.
 * Colors follow semantic conventions: blue=open, yellow=in_progress,
 * green=resolved, gray=closed.
 *
 * vi: "Ban do mau trang thai" / en: "Status color map"
 */
const statusColorMap: Record<SupportTicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  in_progress:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  resolved: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  closed: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
};

interface SupportStatusBadgeProps {
  status: SupportTicketStatus;
  locale?: "vi" | "en";
  className?: string;
}

/**
 * Color-coded badge for support ticket status.
 *
 * WHY: Consistent color coding across list and detail views allows
 * staff to identify ticket status at a glance without reading text.
 *
 * vi: "Huy hieu trang thai phieu ho tro" / en: "Support status badge"
 */
export function SupportStatusBadge({
  status,
  locale = "vi",
  className,
}: SupportStatusBadgeProps) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const label = supportLabels.statuses[status]?.[locale] ?? status;
  return (
    <Badge className={cn("border", statusColorMap[status], className)}>
      {label}
    </Badge>
  );
}
