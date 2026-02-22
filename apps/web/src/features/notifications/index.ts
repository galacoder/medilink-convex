/**
 * Notifications feature module — public exports.
 *
 * WHY: Single import point for all notifications feature components, hooks, labels, and types.
 * Consumers should import from this barrel file, not from sub-paths.
 *
 * Usage:
 *   import { NotificationCenter, useNotifications } from "~/features/notifications"
 *
 * vi: "Xuất module thông báo" / en: "Notification feature module exports"
 */

// Components
export { NotificationCenter } from "./components/notification-center";
export { NotificationItem } from "./components/notification-item";
export { NotificationList } from "./components/notification-list";
export { NotificationPreferences } from "./components/notification-preferences";

// Hooks
export { useNotifications } from "./hooks/use-notifications";
export { useNotificationPreferences } from "./hooks/use-notification-preferences";

// Labels + Types
export * from "./labels";
export * from "./types";
