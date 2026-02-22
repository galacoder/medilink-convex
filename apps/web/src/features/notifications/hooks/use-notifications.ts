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
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { useSession } from "~/auth/client";
import type { NotificationItem, UseNotificationsReturn } from "../types";

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawNotifications = useQuery(
    api.notifications.listForUser,
    userId ? { userId } : "skip",
  );
  const notifications = rawNotifications as NotificationItem[] | undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const markReadMutation = useMutation(api.notifications.markRead);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  const isLoading = notifications === undefined;
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const markRead = useCallback(
    async (notificationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await (markReadMutation as (args: { notificationId: string }) => Promise<void>)({ notificationId });
    },
    [markReadMutation],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (markAllReadMutation as (args: { userId: string }) => Promise<void>)({ userId });
  }, [userId, markAllReadMutation]);

  return { notifications, isLoading, unreadCount, markRead, markAllRead };
}
