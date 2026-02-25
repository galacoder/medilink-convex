/**
 * Billing feature module — subscription status UI components and hooks.
 *
 * WHY: Provides all subscription status indicators (badges, banners,
 * overlays, gates) as a single import for hospital portal layouts.
 *
 * vi: "Mo-dun tinh nang thanh toan — giao dien trang thai dang ky"
 * en: "Billing feature module — subscription status UI"
 */
export * from "./types";
export * from "./labels";
export { useSubscriptionStatus } from "./hooks/use-subscription-status";
export type { OrgSubscriptionData } from "./hooks/use-subscription-status";
export { SubscriptionStatusBadge } from "./components/subscription-status-badge";
export { GracePeriodBanner } from "./components/grace-period-banner";
export { ExpiredOverlay } from "./components/expired-overlay";
export { SuspendedPage } from "./components/suspended-page";
export { SubscriptionGate } from "./components/subscription-gate";
export { TrialBanner } from "./components/trial-banner";
