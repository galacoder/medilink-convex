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

import { useQuery } from "convex/react";

import { api } from "@medilink/db/api";

import type { StatusFilter } from "../types";

/**
 * Fetches all organizations with subscription info for the admin list view.
 *
 * vi: "Lay danh sach to chuc voi trang thai dang ky"
 * en: "Fetch organizations with subscription status"
 */
export function useAdminBillingList(
  statusFilter: StatusFilter = "all",
  searchQuery: string = "",
) {
  const result = useQuery(api.billing.admin.listOrganizationSubscriptions, {
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
    searchQuery: searchQuery || undefined,
  });

  return {
    organizations: result?.organizations ?? [],
    total: result?.total ?? 0,
    isLoading: result === undefined,
  };
}
