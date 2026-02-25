"use client";

/**
 * Notification preferences UI — toggle per-type notification settings.
 *
 * WHY: Users may not want to receive all notification types (e.g., a staff
 * member may only care about equipment_maintenance_due, not quote events).
 * This component lets them opt out of specific notification types.
 * Toggling saves immediately via the Convex mutation (no save button needed).
 *
 * vi: "Giao diện cài đặt tùy chọn thông báo" / en: "Notification preferences UI"
 */
import { useCallback } from "react";

import { Label } from "@medilink/ui/label";
import { Switch } from "@medilink/ui/switch";

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
 * Displays switch toggles for each notification type, allowing users to
 * opt in or out. Defaults to enabled (true) for all types.
 * Toggling saves immediately via updatePreferences mutation.
 *
 * vi: "Tùy chọn thông báo" / en: "Notification preferences"
 */
export function NotificationPreferences({
  locale = "vi",
}: NotificationPreferencesProps) {
  const { preferences, isLoading, updatePreferences } =
    useNotificationPreferences();

  const getPreferenceValue = useCallback(
    (type: NotificationType): boolean => {
      if (!preferences) return true; // Default: all enabled
      const prefValue = preferences[type as keyof typeof preferences];
      if (typeof prefValue === "boolean") return prefValue;
      return true; // Default: enabled if undefined
    },
    [preferences],
  );

  const handleToggle = useCallback(
    (type: NotificationType, enabled: boolean) => {
      void updatePreferences({ [type]: enabled });
    },
    [updatePreferences],
  );

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
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-sm font-medium">
          {notificationLabels.preferences[locale]}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {notificationLabels.preferencesDesc[locale]}
        </p>
      </div>

      <div className="space-y-4">
        {PREFERENCE_TYPES.map((type) => {
          const typeEntry =
            notificationLabels.types[
              type as keyof typeof notificationLabels.types
            ];
          const label = typeEntry[locale];
          const enabled = getPreferenceValue(type);

          return (
            <div key={type} className="flex items-center justify-between gap-4">
              <Label
                htmlFor={`notif-pref-${type}`}
                className="cursor-pointer text-sm font-normal"
              >
                {label}
              </Label>
              <Switch
                id={`notif-pref-${type}`}
                checked={enabled}
                onCheckedChange={(checked) => handleToggle(type, checked)}
                aria-label={label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
