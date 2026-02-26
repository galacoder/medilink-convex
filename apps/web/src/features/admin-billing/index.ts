/**
 * Admin Billing feature module public API.
 *
 * WHY: Single entry point for importing from the admin-billing feature.
 * Components, hooks, and types are all re-exported from here to enforce
 * feature boundaries and avoid deep relative imports.
 *
 * vi: "API cong khai module thanh toan admin"
 * en: "Admin billing feature public API"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */

// Types
export * from "./types";

// Labels
export { billingLabels } from "./labels";

// Hooks
export { useAdminBillingList } from "./hooks/use-admin-billing";
export { useBillingDetail } from "./hooks/use-billing-detail";
export { useBillingMutations } from "./hooks/use-billing-mutations";

// Components
export { StatusBadge } from "./components/status-badge";
export { StatusDashboard } from "./components/status-dashboard";
export { SubscriptionFilters } from "./components/subscription-filters";
export { SubscriptionListTable } from "./components/subscription-list-table";
export { SubscriptionDetailCard } from "./components/subscription-detail-card";
export {
  SubscriptionHistoryTable,
  PaymentHistoryTable,
} from "./components/subscription-history-table";
export { SuspendDialog, ReactivateDialog } from "./components/billing-actions";
