"use client";

/**
 * Hook for managing notifications via Convex reactive queries.
 *
 * WHY: Encapsulates all Convex query/mutation wiring for the notifications
 * feature in a single hook. Components consume this hook instead of calling
 * Convex directly, keeping the Convex API surface in one place.
 *
 * vi: "Hook quản lý thông báo qua Convex" / en: "Hook for managing notifications via Convex"
 */
import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { NotificationItem, UseNotificationsReturn } from "../types";
import { useSession } from "~/auth/client";

/**
 * Hook that returns the current user's notifications and action functions.
 *
 * - `notifications`: Reactive list (undefined while loading)
 * - `isLoading`: true while the query is loading
 * - `unreadCount`: count of unread notifications
 * - `markRead(id)`: marks a single notification as read
 * - `markAllRead()`: marks all notifications as read
 *
 * vi: "Hook thông báo" / en: "Notifications hook"
 */
export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const userId = session?.user.id;

  // Reactive Convex query — skipped until session loads
  const notifications = useQuery(
    api.notifications.listForUser,
    userId ? { userId } : "skip",
  );

  const markReadMutation = useMutation(api.notifications.markRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  const isLoading = notifications === undefined;
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const markRead = useCallback(
    async (notificationId: string) => {
      await (
        markReadMutation as (args: { notificationId: string }) => Promise<void>
      )({ notificationId });
    },
    [markReadMutation],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await (markAllReadMutation as (args: { userId: string }) => Promise<void>)({
      userId,
    });
  }, [userId, markAllReadMutation]);

  return { notifications, isLoading, unreadCount, markRead, markAllRead };
}
