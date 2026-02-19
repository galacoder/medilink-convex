"use client";

/**
 * Hook for the platform admin hospital list with search, filter, and pagination.
 *
 * WHY: Centralizes query logic and filter state so the hospital list page
 * doesn't need to know about Convex internals. Real-time subscriptions
 * via useQuery keep the list updated automatically.
 *
 * vi: "Hook danh sách bệnh viện — Quản trị viên nền tảng"
 * en: "Hospital list hook — Platform Admin"
 */
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type {
  HospitalFilters,
  HospitalListResult,
  HospitalSummary,
} from "../types";

// Cast the api reference to avoid noUncheckedIndexedAccess issues with AnyApi stub.
// WHY: The generated api object is typed as AnyApi which doesn't expose admin.hospitals.
// We cast once here and re-export fully-typed return values.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const adminHospitalsApi = (api as any).admin?.hospitals;
type QueryRef = FunctionReference<"query">;
const listHospitalsFn: QueryRef = adminHospitalsApi?.listHospitals;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const EMPTY_HOSPITALS: HospitalSummary[] = [];

/**
 * Hook wrapping the platform admin listHospitals Convex query.
 * Provides paginated, searchable, filterable hospital list.
 *
 * vi: "Hook danh sách bệnh viện cho quản trị viên nền tảng"
 * en: "Platform admin hospital list hook"
 */
export function useAdminHospitals(
  filters?: HospitalFilters,
  pageSize = 20,
  offset = 0,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(listHospitalsFn, {
    search: filters?.search ?? undefined,
    status: filters?.status ?? undefined,
    pageSize,
    offset,
  });

  const typedResult = result as HospitalListResult | undefined;
  const hospitals: HospitalSummary[] =
    typedResult?.hospitals ?? EMPTY_HOSPITALS;
  const total: number = typedResult?.total ?? 0;
  const hasMore: boolean = typedResult?.hasMore ?? false;

  return {
    result: typedResult,
    hospitals,
    total,
    hasMore,
    isLoading: result === undefined,
  };
}
