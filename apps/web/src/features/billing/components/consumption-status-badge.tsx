/**
 * Status badge for AI credit consumption records.
 *
 * WHY: Provides a consistent, color-coded badge for each consumption
 * status in the credit history table. Bilingual text for each state.
 *
 * vi: "Huy hieu trang thai tieu thu credit AI"
 * en: "Status badge for AI credit consumption records"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */

import { Badge } from "@medilink/ui/badge";

type ConsumptionStatus = "pending" | "completed" | "failed" | "refunded";

interface ConsumptionStatusBadgeProps {
  status: ConsumptionStatus;
}

const STATUS_CONFIG: Record<
  ConsumptionStatus,
  {
    vi: string;
    en: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: {
    vi: "Dang xu ly",
    en: "Processing",
    variant: "secondary",
  },
  completed: {
    vi: "Hoan thanh",
    en: "Completed",
    variant: "default",
  },
  failed: {
    vi: "That bai",
    en: "Failed",
    variant: "destructive",
  },
  refunded: {
    vi: "Hoan tra",
    en: "Refunded",
    variant: "outline",
  },
};

export function ConsumptionStatusBadge({
  status,
}: ConsumptionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.vi} / {config.en}
    </Badge>
  );
}
