"use client";

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
import { Bell } from "lucide-react";

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

import { useNotifications } from "../hooks/use-notifications";
import { notificationLabels } from "../labels";
import { NotificationList } from "./notification-list";

interface NotificationCenterProps {
  locale?: "vi" | "en";
}

export function NotificationCenter({ locale = "vi" }: NotificationCenterProps) {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } =
    useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={notificationLabels.bellAriaLabel[locale]}
        >
          <Bell className="h-5 w-5" />

          {/* Unread badge — only shown when there are unread notifications */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
              aria-label={`${unreadCount} ${notificationLabels.unreadCount[locale]}`}
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
              {notificationLabels.title[locale]}
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
                onClick={markAllRead}
              >
                {notificationLabels.markAllRead[locale]}
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator />

        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkRead={markRead}
          locale={locale}
        />
      </SheetContent>
    </Sheet>
  );
}
