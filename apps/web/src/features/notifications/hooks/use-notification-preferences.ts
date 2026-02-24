"use client";

/**
 * Hook for managing notification preferences via Convex.
 *
 * WHY: Encapsulates the Convex query and mutation for notification preferences,
 * allowing components to read and update which notification types the user
 * wants to receive without knowing the Convex API shape.
 *
 * vi: "Hook quản lý tùy chọn thông báo" / en: "Hook for notification preferences"
 */
import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { UseNotificationPreferencesReturn } from "../types";
import { useSession } from "~/auth/client";

/**
 * Hook that returns the current user's notification preferences.
 *
 * - `preferences`: Convex notificationPreferences document (undefined while loading)
 * - `isLoading`: true while the query is loading
 * - `updatePreferences(prefs)`: updates the notification preferences for the user
 *
 * vi: "Hook tùy chọn thông báo" / en: "Notification preferences hook"
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { data: session } = useSession();
  const userId = session?.user.id;

  // Reactive Convex query — skipped until session loads
  const preferences = useQuery(
    api.notifications.getPreferences,
    userId ? { userId } : "skip",
  );

  const updatePreferencesMutation = useMutation(
    api.notifications.updatePreferences,
  );

  const isLoading = preferences === undefined;

  const updatePreferences = useCallback(
    async (prefs: Record<string, boolean>) => {
      if (!userId) return;
      await updatePreferencesMutation({ userId, preferences: prefs });
    },
    [userId, updatePreferencesMutation],
  );

  return {
    preferences: preferences ?? undefined,
    isLoading,
    updatePreferences,
  };
}
