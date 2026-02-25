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

import { useQuery } from "convex/react";

import type { Id } from "@medilink/db/dataModel";
import { api } from "@medilink/db/api";

/**
 * Fetches full billing detail for a single organization.
 *
 * vi: "Lay chi tiet thanh toan cua to chuc"
 * en: "Fetch billing detail for an organization"
 */
export function useBillingDetail(organizationId: Id<"organizations"> | null) {
  const result = useQuery(
    api.billing.admin.getOrganizationBillingDetail,
    organizationId ? { organizationId } : "skip",
  );

  return {
    detail: result ?? null,
    isLoading: result === undefined,
  };
}
