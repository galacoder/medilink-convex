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

import type { FunctionReference } from "convex/server";
import { useMutation } from "convex/react";

import { api } from "@medilink/backend";

// The billing.admin namespace is dynamically registered at runtime
type MutationRef = FunctionReference<"mutation">;

interface BillingAdminMutationApi {
  activateSubscription: MutationRef;
  extendSubscription: MutationRef;
  suspendSubscription: MutationRef;
  reactivateSubscription: MutationRef;
}

const billingAdminApi = (
  api as unknown as { billing: { admin: BillingAdminMutationApi } }
).billing.admin;

/**
 * Returns mutation hooks for all billing admin actions.
 *
 * vi: "Cac mutation thanh toan admin"
 * en: "Admin billing mutations"
 */
export function useBillingMutations() {
  const activateSubscription = useMutation(
    billingAdminApi.activateSubscription,
  );
  const extendSubscription = useMutation(billingAdminApi.extendSubscription);
  const suspendSubscription = useMutation(
    billingAdminApi.suspendSubscription,
  );
  const reactivateSubscription = useMutation(
    billingAdminApi.reactivateSubscription,
  );

  return {
    activateSubscription,
    extendSubscription,
    suspendSubscription,
    reactivateSubscription,
  };
}
