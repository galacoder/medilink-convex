import { cn } from "@medilink/ui";
import { Badge } from "@medilink/ui/badge";

import type { DisputeStatus } from "../types";
import { disputeLabels } from "../labels";

/**
 * Color map for dispute statuses.
 *
 * WHY: Consistent color coding allows staff to identify dispute status at a glance.
 * Colors follow traffic-light semantics: green=resolved, yellow=reviewing, red=escalated.
 *
 * vi: "Bản đồ màu trạng thái" / en: "Status color map"
 */
const statusColorMap: Record<DisputeStatus, string> = {
  open: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  investigating:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  resolved: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  closed: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
  escalated: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
};

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  locale?: "vi" | "en";
  className?: string;
}

/**
 * Color-coded badge for dispute status.
 *
 * WHY: Consistent color coding across list, detail views allows
 * hospital staff to identify dispute status at a glance without reading text.
 *
 * vi: "Huy hiệu trạng thái tranh chấp" / en: "Dispute status badge"
 */
export function DisputeStatusBadge({
  status,
  locale = "vi",
  className,
}: DisputeStatusBadgeProps) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const label = disputeLabels.statuses[status]?.[locale] ?? status;
  return (
    <Badge className={cn("border", statusColorMap[status], className)}>
      {label}
    </Badge>
  );
}
