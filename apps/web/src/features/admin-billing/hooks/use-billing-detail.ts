/**
 * Hook for admin billing detail view.
 *
 * WHY: Encapsulates the Convex query for a single organization's
 * full billing detail including subscription history, payments, and AI credits.
 *
 * vi: "Hook chi tiet thanh toan admin" / en: "Admin billing detail hook"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";

import type { OrganizationBillingDetail } from "../types";

// The billing.admin namespace is dynamically registered at runtime
type QueryRef = FunctionReference<"query">;

interface BillingAdminQueryApi {
  getOrganizationBillingDetail: QueryRef;
}

const billingAdminApi = (
  api as unknown as { billing: { admin: BillingAdminQueryApi } }
).billing.admin;

/**
 * Fetches full billing detail for a single organization.
 *
 * vi: "Lay chi tiet thanh toan cua to chuc"
 * en: "Fetch billing detail for an organization"
 */
export function useBillingDetail(organizationId: Id<"organizations"> | null) {
  const result = useQuery(
    billingAdminApi.getOrganizationBillingDetail,
    organizationId ? { organizationId } : "skip",
  ) as OrganizationBillingDetail | null | undefined;

  return {
    detail: result ?? null,
    isLoading: result === undefined,
  };
}
