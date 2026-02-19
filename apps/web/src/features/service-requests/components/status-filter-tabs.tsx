"use client";

/**
 * StatusFilterTabs component — filters service requests by status.
 *
 * WHY: shadcn Tabs provides accessible tab navigation with aria-selected
 * and keyboard navigation. All status options have bilingual labels so
 * Vietnamese-speaking staff see primary labels and English is available
 * as a secondary reference.
 *
 * The "all" tab shows all requests (no status filter applied to Convex query).
 */
import { Tabs, TabsList, TabsTrigger } from "@medilink/ui/tabs";

import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

interface StatusFilterTabsProps {
  value: string;
  onValueChange: (value: string) => void;
}

const labels = serviceRequestLabels.status;

const tabs = [
  { value: "all", label: labels.all },
  { value: "pending", label: labels.pending },
  { value: "quoted", label: labels.quoted },
  { value: "accepted", label: labels.accepted },
  { value: "in_progress", label: labels.in_progress },
  { value: "completed", label: labels.completed },
  { value: "cancelled", label: labels.cancelled },
] as const;

export function StatusFilterTabs({
  value,
  onValueChange,
}: StatusFilterTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="h-auto flex-wrap gap-1">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label.vi}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
