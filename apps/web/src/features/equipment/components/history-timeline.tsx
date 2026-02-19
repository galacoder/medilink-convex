"use client";

import { ArrowRightIcon, ClipboardIcon, WrenchIcon, SearchIcon, AlertCircleIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";

import { equipmentLabels } from "../labels";
import { StatusBadge } from "./status-badge";

type EquipmentStatus = "available" | "in_use" | "maintenance" | "damaged" | "retired";

type HistoryActionType = "status_change" | "maintenance" | "repair" | "inspection";

interface HistoryEntry {
  _id: string;
  actionType: HistoryActionType;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  performedBy: string;
  createdAt: number;
}

interface HistoryTimelineProps {
  history: HistoryEntry[];
  isLoading?: boolean;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
}

const actionIconMap: Record<HistoryActionType, React.ReactNode> = {
  status_change: <ArrowRightIcon className="h-4 w-4" />,
  maintenance: <WrenchIcon className="h-4 w-4" />,
  repair: <WrenchIcon className="h-4 w-4" />,
  inspection: <SearchIcon className="h-4 w-4" />,
};

const actionColorMap: Record<HistoryActionType, string> = {
  status_change: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  repair: "bg-orange-100 text-orange-700",
  inspection: "bg-green-100 text-green-700",
};

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionLabel(actionType: HistoryActionType): string {
  const map: Record<HistoryActionType, { vi: string; en: string }> = {
    status_change: equipmentLabels.actionTypes.status_changed,
    maintenance: equipmentLabels.actionTypes.maintenance_scheduled,
    repair: { vi: "Sửa chữa", en: "Repaired" },
    inspection: { vi: "Kiểm tra", en: "Inspected" },
  };
  return map[actionType]?.vi ?? actionType;
}

/**
 * Chronological timeline of equipment audit history.
 *
 * WHY: Hospital staff need to trace who changed equipment status, when, and
 * why for compliance and accountability. The timeline format makes the sequence
 * of events clear at a glance.
 */
export function HistoryTimeline({
  history,
  isLoading = false,
  canLoadMore = false,
  onLoadMore,
}: HistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-48 animate-pulse rounded" />
              <div className="bg-muted h-3 w-32 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-6 py-8 text-center text-sm">
        {equipmentLabels.historyEmpty.vi}
      </p>
    );
  }

  return (
    <div className="space-y-0">
      <div className="relative space-y-0">
        {history.map((entry, index) => (
          <div key={entry._id} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  actionColorMap[entry.actionType] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {actionIconMap[entry.actionType] ?? (
                  <AlertCircleIcon className="h-4 w-4" />
                )}
              </div>
              {index < history.length - 1 && (
                <div className="bg-border w-px flex-1" style={{ minHeight: "24px" }} />
              )}
            </div>

            {/* Entry content */}
            <div className="pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {getActionLabel(entry.actionType)}
                </span>
                {entry.previousStatus && entry.newStatus && (
                  <div className="flex items-center gap-1">
                    <StatusBadge
                      status={entry.previousStatus as EquipmentStatus}
                      locale="vi"
                    />
                    <ArrowRightIcon className="text-muted-foreground h-3 w-3" />
                    <StatusBadge
                      status={entry.newStatus as EquipmentStatus}
                      locale="vi"
                    />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatTimestamp(entry.createdAt)}
              </p>
              {entry.notes && (
                <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {canLoadMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            {equipmentLabels.loadMore.vi}
          </Button>
        </div>
      )}
    </div>
  );
}
