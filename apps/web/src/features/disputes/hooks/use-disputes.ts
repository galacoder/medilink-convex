"use client";

import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

import type { Id } from "@medilink/db/dataModel";
import { api } from "@medilink/db/api";

import type { DisputeFilters, DisputeWithRef } from "../types";

// Cast the api reference to avoid noUncheckedIndexedAccess issues with AnyApi stub.
// The generated api object always has these functions at runtime.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const disputesApi = api.disputes as any;
type QueryRef = FunctionReference<"query">;
const listByHospitalFn: QueryRef = disputesApi.listByHospital;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook wrapping Convex hospital disputes query.
 *
 * WHY: Centralizes filter state and query logic so the list page
 * and other consumers don't need to know about Convex internals.
 * Real-time subscriptions update the list automatically when disputes change.
 *
 * vi: "Hook danh sách tranh chấp" / en: "Disputes list hook"
 */
export function useDisputes(
  organizationId: Id<"organizations"> | undefined,
  filters?: DisputeFilters,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const disputes = useQuery(
    listByHospitalFn,
    organizationId
      ? {
          organizationId,
          status: filters?.status,
        }
      : "skip",
  );

  return {
    disputes: (disputes ?? []) as DisputeWithRef[],
    isLoading: disputes === undefined,
  };
}
