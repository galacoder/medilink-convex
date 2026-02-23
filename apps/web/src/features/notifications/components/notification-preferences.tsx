"use client";

/**
 * Notification preferences UI — toggle per-type notification settings.
 *
 * WHY: Users may not want to receive all notification types (e.g., a staff
 * member may only care about equipment_maintenance_due, not quote events).
 * This component lets them opt out of specific notification types.
 *
 * vi: "Giao diện cài đặt tùy chọn thông báo" / en: "Notification preferences UI"
 */
import { useCallback, useState } from "react";

import { Button } from "@medilink/ui/button";
import { Checkbox } from "@medilink/ui/checkbox";

import type { NotificationType } from "../types";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { notificationLabels } from "../labels";

interface NotificationPreferencesProps {
  locale?: "vi" | "en";
}

/** Notification types available for preference toggling */
const PREFERENCE_TYPES: NotificationType[] = [
  "service_request_new_quote",
  "service_request_quote_approved",
  "service_request_quote_rejected",
  "service_request_started",
  "service_request_completed",
  "equipment_maintenance_due",
  "equipment_status_broken",
  "consumable_stock_low",
  "dispute_new_message",
  "dispute_resolved",
];

/**
 * Displays toggle switches for each notification type, allowing users to
 * opt in or out. Defaults to enabled (true) for all types.
 *
 * vi: "Tùy chọn thông báo" / en: "Notification preferences"
 */
export function NotificationPreferences({
  locale = "vi",
}: NotificationPreferencesProps) {
  const { preferences, isLoading, updatePreferences } =
    useNotificationPreferences();

  // Local state for optimistic toggling before saving
  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const getPreferenceValue = useCallback(
    (type: NotificationType): boolean => {
      // Local override takes priority, then Convex value, then default true
      if (type in localPrefs) return localPrefs[type] ?? true;
      const prefValue = preferences?.[type as keyof typeof preferences];
      if (typeof prefValue === "boolean") return prefValue;
      return true; // Default: all enabled
    },
    [localPrefs, preferences],
  );

  const handleToggle = useCallback(
    (type: NotificationType, enabled: boolean) => {
      setLocalPrefs((prev) => ({ ...prev, [type]: enabled }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPrefs);
      setLocalPrefs({});
    } finally {
      setIsSaving(false);
    }
  }, [localPrefs, updatePreferences]);

  const hasChanges = Object.keys(localPrefs).length > 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          {notificationLabels.loading[locale]}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-medium">
          {notificationLabels.preferences[locale]}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {notificationLabels.preferencesDesc[locale]}
        </p>
      </div>

      <div className="space-y-3">
        {PREFERENCE_TYPES.map((type) => {
          const typeEntry =
            notificationLabels.types[
              type as keyof typeof notificationLabels.types
            ];
          const label = typeEntry[locale];
          const enabled = getPreferenceValue(type);

          return (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`notif-pref-${type}`}
                checked={enabled}
                onCheckedChange={(checked) =>
                  handleToggle(type, checked === true)
                }
                aria-label={label}
              />
              <label
                htmlFor={`notif-pref-${type}`}
                className="cursor-pointer text-sm"
              >
                {label}
              </label>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="w-full"
        >
          {isSaving
            ? notificationLabels.loading[locale]
            : notificationLabels.save[locale]}
        </Button>
      )}
    </div>
  );
}
