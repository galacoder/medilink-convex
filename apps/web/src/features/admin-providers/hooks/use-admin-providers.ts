"use client";

import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import type {
  AdminProviderDetail,
  AdminProviderFilters,
  AdminProviderListItem,
  ProviderPerformanceMetrics,
} from "../types";

// ---------------------------------------------------------------------------
// Type-safe API references
// ---------------------------------------------------------------------------
// WHY: The generated api object uses AnyApi stub types. We cast to specific
// FunctionReference types to keep the hooks strongly typed at the call site.

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const adminProvidersApi = (api as any).admin.providers;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const listProvidersFn: QueryRef = adminProvidersApi.listProviders;
const getProviderDetailFn: QueryRef = adminProvidersApi.getProviderDetail;
const getProviderPerformanceFn: QueryRef =
  adminProvidersApi.getProviderPerformance;
const approveProviderFn: MutationRef = adminProvidersApi.approveProvider;
const rejectProviderFn: MutationRef = adminProvidersApi.rejectProvider;
const suspendProviderFn: MutationRef = adminProvidersApi.suspendProvider;
const verifyCertificationFn: MutationRef =
  adminProvidersApi.verifyCertification;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook for the platform admin provider list.
 *
 * WHY: Centralizes filter state + real-time subscription for the admin list page.
 * The Convex useQuery hook subscribes to updates and re-renders automatically
 * when provider data changes (e.g., another admin approves/rejects a provider).
 *
 * vi: "Hook danh sách nhà cung cấp (quản trị viên)" / en: "Admin provider list hook"
 */
export function useAdminProviders(filters?: AdminProviderFilters): {
  providers: AdminProviderListItem[];
  isLoading: boolean;
  totalCount: number;
} {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawProviders = useQuery(listProvidersFn, {
    status: filters?.status,
    verificationStatus: filters?.verificationStatus,
  });
  const providers = rawProviders as AdminProviderListItem[] | undefined;

  // Client-side search filter on top of the Convex status filter
  const search = filters?.search;
  const filtered: AdminProviderListItem[] = search
    ? (providers ?? []).filter(
        (p) =>
          p.nameVi.toLowerCase().includes(search.toLowerCase()) ||
          p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          (p.companyName?.toLowerCase().includes(search.toLowerCase()) ??
            false) ||
          (p.organizationName?.toLowerCase().includes(search.toLowerCase()) ??
            false),
      )
    : (providers ?? []);

  return {
    providers: filtered,
    isLoading: providers === undefined,
    totalCount: (providers ?? []).length,
  };
}

/**
 * Hook for a single provider's full detail.
 *
 * WHY: Detail page needs enriched data (certifications, offerings, coverage areas)
 * that the list query doesn't include. Separate query keeps list performance fast.
 *
 * vi: "Hook chi tiết nhà cung cấp" / en: "Provider detail hook"
 */
export function useAdminProviderDetail(providerId: string | undefined): {
  provider: AdminProviderDetail | null;
  isLoading: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawDetail = useQuery(
    getProviderDetailFn,
    providerId ? { providerId } : "skip",
  );
  const detail = rawDetail as AdminProviderDetail | undefined;

  return {
    provider: detail ?? null,
    isLoading: providerId !== undefined && detail === undefined,
  };
}

/**
 * Hook for provider performance metrics.
 *
 * WHY: Performance data is computed from multiple tables (service requests,
 * ratings, disputes). Keeping it in a separate query avoids slowing down
 * the detail query for providers that have no services yet.
 *
 * vi: "Hook hiệu suất nhà cung cấp" / en: "Provider performance hook"
 */
export function useProviderPerformance(providerId: string | undefined): {
  metrics: ProviderPerformanceMetrics | null;
  isLoading: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawMetrics = useQuery(
    getProviderPerformanceFn,
    providerId ? { providerId } : "skip",
  );
  const metrics = rawMetrics as ProviderPerformanceMetrics | undefined;

  return {
    metrics: metrics ?? null,
    isLoading: providerId !== undefined && metrics === undefined,
  };
}

/**
 * Hook bundling all admin provider mutation actions.
 *
 * WHY: Co-locating mutations in one hook lets the detail page import a single
 * hook instead of calling useMutation four times separately.
 *
 * vi: "Hook thao tác quản trị nhà cung cấp" / en: "Admin provider actions hook"
 */
export function useAdminProviderActions() {
  const approveProvider = useMutation(approveProviderFn);
  const rejectProvider = useMutation(rejectProviderFn);
  const suspendProvider = useMutation(suspendProviderFn);
  const verifyCertification = useMutation(verifyCertificationFn);

  return {
    approveProvider,
    rejectProvider,
    suspendProvider,
    verifyCertification,
  };
}
