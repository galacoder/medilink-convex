/**
 * Admin Billing Payments feature module public API.
 *
 * WHY: Single entry point for importing from the admin-billing-payments feature.
 * Components, hooks, and types are all re-exported from here to enforce
 * feature boundaries and avoid deep relative imports.
 *
 * vi: "API cong khai module quan ly thanh toan" / en: "Payment management feature public API"
 */

// Types
export * from "./types";

// Labels
export { adminPaymentLabels } from "./labels";

// Utils
export { formatVnd, formatDate, formatDateTime } from "./utils";

// Hooks
export { useAdminPayments } from "./hooks/use-admin-payments";
export { usePaymentDetail } from "./hooks/use-payment-detail";
export {
  useRecordPayment,
  useConfirmPayment,
  useRejectPayment,
  useVoidPayment,
} from "./hooks/use-payment-mutations";

// Components
export { PaymentStatusBadge } from "./components/payment-status-badge";
export { PaymentFiltersBar } from "./components/payment-filters";
export { PaymentTable } from "./components/payment-table";
export {
  PaymentActions,
  ConfirmPaymentDialog,
  RejectPaymentDialog,
  VoidPaymentDialog,
} from "./components/payment-actions";
export { RecordPaymentForm } from "./components/record-payment-form";
export { PaymentDetailCard } from "./components/payment-detail-card";
