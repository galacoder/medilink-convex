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

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const billingPaymentsApi = (api as any).billing?.payments;
type MutationRef = FunctionReference<"mutation">;
const recordPaymentFn: MutationRef = billingPaymentsApi?.recordPayment;
const confirmPaymentFn: MutationRef = billingPaymentsApi?.confirmPayment;
const rejectPaymentFn: MutationRef = billingPaymentsApi?.rejectPayment;
const voidPaymentFn: MutationRef = billingPaymentsApi?.voidPayment;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/** Hook for recording a new payment */
export function useRecordPayment() {
  return useMutation(recordPaymentFn);
}

/** Hook for confirming a pending payment */
export function useConfirmPayment() {
  return useMutation(confirmPaymentFn);
}

/** Hook for rejecting a pending payment */
export function useRejectPayment() {
  return useMutation(rejectPaymentFn);
}

/** Hook for voiding a confirmed payment */
export function useVoidPayment() {
  return useMutation(voidPaymentFn);
}
