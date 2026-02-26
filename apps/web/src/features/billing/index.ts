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
// AI credit UI (M1-8)
export { getBalanceState } from "./lib/credit-balance-state";
export type { BalanceState } from "./lib/credit-balance-state";
export { CreditBalanceWidget } from "./components/credit-balance-widget";
export { CreditIndicator } from "./components/credit-indicator";
export { AiActionButton } from "./components/ai-action-button";
export { InsufficientCreditsModal } from "./components/insufficient-credits-modal";
export { CreditHistoryTable } from "./components/credit-history-table";
export { ConsumptionStatusBadge } from "./components/consumption-status-badge";
