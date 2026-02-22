/**
 * TypeScript types for the notifications feature module.
 *
 * vi: "Kiểu TypeScript cho module thông báo" / en: "TypeScript types for notifications module"
 */
import type { Doc } from "convex/_generated/dataModel";

/** Notification document from Convex */
export type NotificationItem = Doc<"notifications">;

/** Notification type literals — mirrors the Convex validator */
export type NotificationType =
  | "service_request_new_quote"
  | "service_request_quote_approved"
  | "service_request_quote_rejected"
  | "service_request_started"
  | "service_request_completed"
  | "equipment_maintenance_due"
  | "equipment_status_broken"
  | "consumable_stock_low"
  | "dispute_new_message"
  | "dispute_resolved";

/** Notification user preferences document from Convex */
export type NotificationPreferences = Doc<"notificationPreferences">;

/** Supported locale values */
export type Locale = "vi" | "en";

/** Shape returned by the useNotifications hook */
export interface UseNotificationsReturn {
  notifications: NotificationItem[] | undefined;
  isLoading: boolean;
  unreadCount: number;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/** Shape returned by the useNotificationPreferences hook */
export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | undefined;
  isLoading: boolean;
  updatePreferences: (preferences: Record<string, boolean>) => Promise<void>;
}
