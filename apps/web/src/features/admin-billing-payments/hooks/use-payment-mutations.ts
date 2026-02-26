"use client";

/**
 * Hooks wrapping payment mutation functions (record, confirm, reject, void).
 *
 * WHY: Centralizes mutation logic and provides typed wrappers for the UI.
 *
 * vi: "Hook mutation thanh toan" / en: "Payment mutation hooks"
 */
import type { FunctionReference } from "convex/server";
import { useMutation } from "convex/react";

import { api } from "@medilink/backend";

// The billing.payments namespace is dynamically registered at runtime.
// We extract typed function references via a helper to avoid eslint-disable blocks.
type MutationRef = FunctionReference<"mutation">;

interface BillingPaymentsApi {
  recordPayment: MutationRef;
  confirmPayment: MutationRef;
  rejectPayment: MutationRef;
  voidPayment: MutationRef;
}

const billingPaymentsApi = (
  api as unknown as { billing: { payments: BillingPaymentsApi } }
).billing.payments;

/** Hook for recording a new payment */
export function useRecordPayment() {
  return useMutation(billingPaymentsApi.recordPayment);
}

/** Hook for confirming a pending payment */
export function useConfirmPayment() {
  return useMutation(billingPaymentsApi.confirmPayment);
}

/** Hook for rejecting a pending payment */
export function useRejectPayment() {
  return useMutation(billingPaymentsApi.rejectPayment);
}

/** Hook for voiding a confirmed payment */
export function useVoidPayment() {
  return useMutation(billingPaymentsApi.voidPayment);
}
