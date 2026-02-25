/**
 * Hook for admin billing subscription list.
 *
 * WHY: Encapsulates Convex query logic and provides a clean API
 * for the billing list page to consume.
 *
 * vi: "Hook danh sach dang ky admin" / en: "Admin billing list hook"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type { OrganizationSubscriptionRow, StatusFilter } from "../types";

// The billing.admin namespace is dynamically registered at runtime
type QueryRef = FunctionReference<"query">;

interface BillingAdminQueryApi {
  listOrganizationSubscriptions: QueryRef;
}

const billingAdminApi = (
  api as unknown as { billing: { admin: BillingAdminQueryApi } }
).billing.admin;

/**
 * Fetches all organizations with subscription info for the admin list view.
 *
 * vi: "Lay danh sach to chuc voi trang thai dang ky"
 * en: "Fetch organizations with subscription status"
 */
export function useAdminBillingList(
  statusFilter: StatusFilter = "all",
  searchQuery = "",
) {
  const result = useQuery(billingAdminApi.listOrganizationSubscriptions, {
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
    searchQuery: searchQuery || undefined,
  }) as
    | { organizations: OrganizationSubscriptionRow[]; total: number }
    | undefined;

  return {
    organizations: result?.organizations ?? [],
    total: result?.total ?? 0,
    isLoading: result === undefined,
  };
}
