"use client";

/**
 * Hook for fetching a single payment's full detail including org and subscription info.
 *
 * vi: "Hook chi tiet thanh toan" / en: "Payment detail hook"
 */
import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { PaymentDetail } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const billingPaymentsApi = (api as any).billing?.payments;
type QueryRef = FunctionReference<"query">;
const getPaymentDetailFn: QueryRef = billingPaymentsApi?.getPaymentDetail;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook wrapping the admin getPaymentDetail Convex query.
 *
 * vi: "Hook chi tiet thanh toan cho quan tri vien" / en: "Admin payment detail hook"
 */
export function usePaymentDetail(paymentId: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(
    getPaymentDetailFn,
    paymentId ? { paymentId } : "skip",
  );

  return {
    payment: result as PaymentDetail | null | undefined,
    isLoading: result === undefined,
  };
}
