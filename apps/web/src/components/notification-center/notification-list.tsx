"use client";

import type { Doc } from "convex/_generated/dataModel";

import { ScrollArea } from "@medilink/ui/scroll-area";
import { Skeleton } from "@medilink/ui/skeleton";

import { NotificationItem } from "./notification-item";

/**
 * Groups notifications by date for visual separation.
 * vi: "Nhóm thông báo theo ngày" / en: "Group notifications by date"
 */
function groupNotificationsByDate(
  notifications: Doc<"notifications">[],
  locale: "vi" | "en",
): { label: string; items: Doc<"notifications">[] }[] {
  const groups = new Map<string, Doc<"notifications">[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  for (const notification of notifications) {
    const date = new Date(notification.createdAt);
    const dateStr = date.toDateString();

    let label: string;
    if (dateStr === today) {
      label = locale === "vi" ? "Hôm nay" : "Today";
    } else if (dateStr === yesterday) {
      label = locale === "vi" ? "Hôm qua" : "Yesterday";
    } else {
      label = date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    const existing = groups.get(label) ?? [];
    existing.push(notification);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

interface NotificationListProps {
  notifications: Doc<"notifications">[] | undefined;
  isLoading?: boolean;
  onMarkRead: (id: string) => void;
  locale?: "vi" | "en";
}

/**
 * Scrollable notification list with date grouping and loading state.
 *
 * WHY: Groups notifications by date so users can quickly scan what's new
 * today vs. older items. Uses ScrollArea to contain long lists without
 * expanding the parent popover beyond a fixed height.
 *
 * vi: "Danh sách thông báo có cuộn" / en: "Scrollable notification list"
 */
export function NotificationList({
  notifications,
  isLoading = false,
  onMarkRead,
  locale = "vi",
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-muted-foreground text-4xl">🔔</div>
        <p className="text-muted-foreground mt-2 text-sm">
          {locale === "vi" ? "Không có thông báo nào" : "No notifications yet"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {locale === "vi"
            ? "Các thông báo quan trọng sẽ xuất hiện tại đây"
            : "Important notifications will appear here"}
        </p>
      </div>
    );
  }

  const groups = groupNotificationsByDate(notifications, locale);

  return (
    <ScrollArea className="h-[360px]">
      <div className="space-y-4 p-2">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Date group header */}
            <div className="mb-1 px-3 py-1">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {group.label}
              </span>
            </div>

            {/* Notifications in this date group */}
            <div className="space-y-0.5">
              {group.items.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
