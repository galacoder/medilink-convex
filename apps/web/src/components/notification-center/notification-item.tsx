"use client";

import type { Doc } from "convex/_generated/dataModel";

import { cn } from "@medilink/ui";

/**
 * Bilingual labels for notification types.
 * vi: "Nhãn loại thông báo" / en: "Notification type labels"
 */
const NOTIFICATION_TYPE_LABELS: Record<string, { vi: string; en: string }> = {
  service_request_new_quote: {
    vi: "Báo giá mới",
    en: "New Quote",
  },
  service_request_quote_approved: {
    vi: "Báo giá được chấp thuận",
    en: "Quote Approved",
  },
  service_request_quote_rejected: {
    vi: "Báo giá bị từ chối",
    en: "Quote Rejected",
  },
  service_request_started: {
    vi: "Dịch vụ đã bắt đầu",
    en: "Service Started",
  },
  service_request_completed: {
    vi: "Dịch vụ hoàn thành",
    en: "Service Completed",
  },
  equipment_maintenance_due: {
    vi: "Bảo trì đến hạn",
    en: "Maintenance Due",
  },
  equipment_status_broken: {
    vi: "Thiết bị hỏng",
    en: "Equipment Broken",
  },
  consumable_stock_low: {
    vi: "Vật tư sắp hết",
    en: "Low Stock",
  },
  dispute_new_message: {
    vi: "Tin nhắn tranh chấp",
    en: "Dispute Message",
  },
  dispute_resolved: {
    vi: "Tranh chấp đã giải quyết",
    en: "Dispute Resolved",
  },
};

/**
 * Formats a timestamp into a relative or absolute date string.
 * vi: "Định dạng thời gian thông báo" / en: "Format notification timestamp"
 */
function formatNotificationTime(createdAt: number): string {
  const now = Date.now();
  const diffMs = now - createdAt;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Vừa xong"; // Just now
  if (diffMinutes < 60) return `${diffMinutes} phút trước`; // N minutes ago
  if (diffHours < 24) return `${diffHours} giờ trước`; // N hours ago
  if (diffDays < 7) return `${diffDays} ngày trước`; // N days ago

  return new Date(createdAt).toLocaleDateString("vi-VN");
}

interface NotificationItemProps {
  notification: Doc<"notifications">;
  onMarkRead: (id: string) => void;
  locale?: "vi" | "en";
}

/**
 * Single notification item in the notification list.
 *
 * WHY: Displays bilingual title, body, type label, and timestamp.
 * Unread notifications have a visual indicator (blue dot + lighter bg).
 * Clicking an unread notification marks it as read.
 *
 * vi: "Mục thông báo đơn" / en: "Single notification item"
 */
export function NotificationItem({
  notification,
  onMarkRead,
  locale = "vi",
}: NotificationItemProps) {
  const typeLabel =
    NOTIFICATION_TYPE_LABELS[notification.type]?.[locale] ?? notification.type;
  const title = locale === "vi" ? notification.titleVi : notification.titleEn;
  const body = locale === "vi" ? notification.bodyVi : notification.bodyEn;

  function handleClick() {
    if (!notification.read) {
      onMarkRead(notification._id);
    }
  }

  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-md p-3 text-left transition-colors",
        "hover:bg-accent/50",
        !notification.read && "bg-primary/5",
      )}
      onClick={handleClick}
      aria-label={`${notification.read ? "Thông báo đã đọc" : "Thông báo chưa đọc"}: ${title}`}
    >
      {/* Unread indicator dot */}
      <div className="mt-1.5 flex shrink-0 items-center justify-center">
        {!notification.read ? (
          <div className="bg-primary h-2 w-2 rounded-full" aria-hidden="true" />
        ) : (
          <div className="h-2 w-2" aria-hidden="true" />
        )}
      </div>

      {/* Notification content */}
      <div className="min-w-0 flex-1">
        {/* Type badge + time */}
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground truncate text-xs font-medium">
            {typeLabel}
          </span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>

        {/* Title */}
        <p
          className={cn(
            "truncate text-sm",
            notification.read
              ? "text-foreground/70"
              : "text-foreground font-medium",
          )}
        >
          {title}
        </p>

        {/* Body */}
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
          {body}
        </p>
      </div>
    </button>
  );
}
