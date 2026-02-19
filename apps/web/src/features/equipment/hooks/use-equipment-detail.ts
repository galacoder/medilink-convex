"use client";

import { type PaginatedQueryReference, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

// Cast api to avoid noUncheckedIndexedAccess issues with AnyApi stub
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equipmentApi = api.equipment as any;

type QueryRef = FunctionReference<"query">;

/**
 * Composite hook for equipment detail page.
 *
 * WHY: The detail page needs three reactive data sources (equipment, history,
 * maintenance schedule) that update in real-time. Composing them here keeps
 * the page component clean and testable.
 */
export function useEquipmentDetail(id: Id<"equipment"> | undefined) {
  const equipment = useQuery(
    equipmentApi.getById as QueryRef,
    id ? { id } : "skip",
  );

  const {
    results: history,
    status: historyStatus,
    loadMore: loadMoreHistoryFn,
  } = usePaginatedQuery(
    equipmentApi.getHistory as PaginatedQueryReference,
    id ? { equipmentId: id } : "skip",
    { initialNumItems: 10 },
  );

  const maintenanceSchedule = useQuery(
    equipmentApi.getMaintenanceSchedule as QueryRef,
    id ? { equipmentId: id } : "skip",
  );

  return {
    equipment: equipment ?? null,
    isLoading: equipment === undefined,
    history,
    historyLoading: historyStatus === "LoadingFirstPage",
    loadMoreHistory: () => loadMoreHistoryFn(10),
    maintenanceSchedule: maintenanceSchedule ?? [],
  };
}
