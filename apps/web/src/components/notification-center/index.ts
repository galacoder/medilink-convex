/**
 * Notification center barrel export — re-exports from features/notifications/.
 *
 * WHY: Components have been promoted to the feature module at
 * src/features/notifications/. This file is kept for backward-compatibility
 * so existing imports of "~/components/notification-center" continue to work.
 * New code should import from "~/features/notifications" directly.
 *
 * vi: "Xuất trung tâm thông báo" / en: "Notification center exports"
 */
export { NotificationCenter } from "~/features/notifications/components/notification-center";
export { NotificationList } from "~/features/notifications/components/notification-list";
export { NotificationItem } from "~/features/notifications/components/notification-item";
