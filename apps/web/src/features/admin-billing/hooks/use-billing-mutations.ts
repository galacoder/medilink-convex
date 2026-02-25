/**
 * Hooks for admin billing mutations.
 *
 * WHY: Wraps Convex useMutation calls for subscription lifecycle actions
 * (activate, extend, suspend, reactivate) with consistent typing.
 *
 * vi: "Hook mutation thanh toan admin" / en: "Admin billing mutation hooks"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { useMutation } from "convex/react";

import { api } from "@medilink/db/api";

/**
 * Returns mutation hooks for all billing admin actions.
 *
 * vi: "Cac mutation thanh toan admin"
 * en: "Admin billing mutations"
 */
export function useBillingMutations() {
  const activateSubscription = useMutation(
    api.billing.admin.activateSubscription,
  );
  const extendSubscription = useMutation(api.billing.admin.extendSubscription);
  const suspendSubscription = useMutation(
    api.billing.admin.suspendSubscription,
  );
  const reactivateSubscription = useMutation(
    api.billing.admin.reactivateSubscription,
  );

  return {
    activateSubscription,
    extendSubscription,
    suspendSubscription,
    reactivateSubscription,
  };
}
