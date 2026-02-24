"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Separator } from "@medilink/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@medilink/ui/sheet";

import { useSession } from "~/auth/client";
import { NotificationList } from "./notification-list";

/**
 * Bilingual labels for the notification center.
 * vi: "Nhãn trung tâm thông báo" / en: "Notification center labels"
 */
const LABELS = {
  title: { vi: "Thông báo", en: "Notifications" },
  markAllRead: { vi: "Đánh dấu tất cả đã đọc", en: "Mark all as read" },
  unreadCount: { vi: "thông báo chưa đọc", en: "unread notifications" },
  bellAriaLabel: {
    vi: "Mở trung tâm thông báo",
    en: "Open notification center",
  },
} as const;

interface NotificationCenterProps {
  locale?: "vi" | "en";
}

/**
 * Notification center — bell icon with unread badge + slide-in panel.
 *
 * WHY: Using a Sheet (slide-in panel) instead of a popover for notification
 * center provides more vertical space for the notification list, and avoids
 * popover overflow issues on smaller screens. The Sheet is anchored to the
 * right side of the screen, consistent with the header position.
 *
 * Real-time: The notification list uses useQuery() which is a Convex reactive
 * subscription — new notifications appear instantly without polling.
 *
 * vi: "Trung tâm thông báo" / en: "Notification center"
 */
export function NotificationCenter({ locale = "vi" }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  // We need the Convex user ID for queries. Better Auth stores the userId
  // in the session — Convex user IDs are the same as Better Auth user IDs
  // via the Convex adapter.
  const userId = session?.user.id;

  // Reactive notification list — updates in real time via Convex subscriptions
  const notifications = useQuery(
    api.notifications.listForUser,
    userId ? { userId } : "skip",
  );

  // Mutations
  const markReadMutation = useMutation(api.notifications.markRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  // Compute unread count
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleMarkRead = useCallback(
    async (notificationId: string) => {
      await markReadMutation({
        notificationId: notificationId as Id<"notifications">,
      });
    },
    [markReadMutation],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllReadMutation({ userId });
  }, [userId, markAllReadMutation]);

  const isLoading = notifications === undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={LABELS.bellAriaLabel[locale]}
        >
          <Bell className="h-5 w-5" />

          {/* Unread badge — only shown when there are unread notifications */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
              aria-label={`${unreadCount} ${LABELS.unreadCount[locale]}`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[380px] p-0 sm:w-[420px]">
        <SheetHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">
              {LABELS.title[locale]}
              {unreadCount > 0 && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  ({unreadCount})
                </span>
              )}
            </SheetTitle>

            {/* Mark all as read button — only shown when there are unread items */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-auto px-2 py-1 text-xs"
                onClick={handleMarkAllRead}
              >
                {LABELS.markAllRead[locale]}
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator />

        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkRead={handleMarkRead}
          locale={locale}
        />
      </SheetContent>
    </Sheet>
  );
}
