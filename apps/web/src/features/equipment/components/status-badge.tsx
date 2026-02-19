"use client";

import { Badge } from "@medilink/ui/badge";
import { cn } from "@medilink/ui";

import { equipmentLabels } from "../labels";

type EquipmentStatus = "available" | "in_use" | "maintenance" | "damaged" | "retired";

const statusColorMap: Record<EquipmentStatus, string> = {
  available: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  in_use: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  maintenance: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  damaged: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  retired: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
};

interface StatusBadgeProps {
  status: EquipmentStatus;
  locale?: "vi" | "en";
  className?: string;
}

/**
 * Color-coded badge for equipment status.
 *
 * WHY: Consistent color coding across list, detail, and card views allows
 * hospital staff to identify equipment status at a glance without reading text.
 * Bilingual support covers both Vietnamese staff and international equipment labels.
 */
export function StatusBadge({ status, locale = "vi", className }: StatusBadgeProps) {
  const label = equipmentLabels.statusValues[status]?.[locale] ?? status;
  return (
    <Badge
      className={cn(
        "border",
        statusColorMap[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
