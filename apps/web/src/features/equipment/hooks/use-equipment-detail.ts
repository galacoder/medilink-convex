"use client";

import type { Id } from "convex/_generated/dataModel";
import type { PaginatedQueryReference } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";

import type { Equipment } from "../types";

// Cast api to avoid noUncheckedIndexedAccess issues with AnyApi stub.
// The generated api object always has these functions at runtime, but
// the AnyApi stub types them as `any` due to TypeScript index access.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const equipmentApi = api.equipment as any;
type QueryRef = FunctionReference<"query">;
const getByIdFn: QueryRef = equipmentApi.getById;
const getHistoryFn: PaginatedQueryReference = equipmentApi.getHistory;
const getMaintenanceScheduleFn: QueryRef = equipmentApi.getMaintenanceSchedule;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Composite hook for equipment detail page.
 *
 * WHY: The detail page needs three reactive data sources (equipment, history,
 * maintenance schedule) that update in real-time. Composing them here keeps
 * the page component clean and testable.
 */
export function useEquipmentDetail(id: Id<"equipment"> | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const equipment = useQuery(getByIdFn, id ? { id } : "skip");

  const {
    results: history,
    status: historyStatus,
    loadMore: loadMoreHistoryFn,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  } = usePaginatedQuery(getHistoryFn, id ? { equipmentId: id } : "skip", {
    initialNumItems: 10,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const maintenanceSchedule = useQuery(
    getMaintenanceScheduleFn,
    id ? { equipmentId: id } : "skip",
  );

  // Cast to typed values since useQuery/usePaginatedQuery with any-typed fn references return any
  interface HistoryEntry {
    _id: string;
    actionType: "status_change" | "maintenance" | "repair" | "inspection";
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    performedBy: string;
    createdAt: number;
  }

  return {
    equipment: (equipment ?? null) as Equipment | null,
    isLoading: equipment === undefined,
    history: history as HistoryEntry[],
    historyLoading: historyStatus === "LoadingFirstPage",
    loadMoreHistory: () => loadMoreHistoryFn(10),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    maintenanceSchedule: maintenanceSchedule ?? [],
  };
}
