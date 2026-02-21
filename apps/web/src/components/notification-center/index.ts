/**
 * Notification center barrel export.
 *
 * WHY: Single import point for all notification center components.
 * The NotificationCenter component is shared across hospital, provider,
 * and admin portal layouts via the shared Header component.
 *
 * vi: "Xuất trung tâm thông báo" / en: "Notification center exports"
 */
export { NotificationCenter } from "./notification-center";
export { NotificationList } from "./notification-list";
export { NotificationItem } from "./notification-item";
